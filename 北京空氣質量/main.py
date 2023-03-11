import requests
import execjs
import re

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
}

# 獲取主頁
def getIndexPage(url):
    resp = requests.get(url=url,headers=headers)
    return resp.text

# 獲取js路徑，就在主頁源代碼中
def getJsUrl(page):
    regx = re.compile(r'<script type="text/javascript" src="resource/js/(.*?)"></script>',re.S)
    res = regx.findall(page)
    # print(res[1])
    return res[1]

# 請求js代碼
def getJsCode(base,url):
    resp = requests.get(base+url,headers=headers)
    jsCode = resp.text
    resp.close()
    return jsCode


def replaceEval(jsCode):
    return jsCode.replace("eval","")

def decodeJsCode(jsCode):
    # 因為js代碼被eval"加密"，所以要先將eval的內容弄出來
    # 具體方法：直接執行eval(XXX)中的XXX
    jsCode = replaceEval(jsCode)
    ctx = execjs.compile("function func(){return "+jsCode+"}")
    ret = ctx.call('func')

    # 返回的結果分3種情況
    ### 有時要用dweklxde再解密，有時唔洗 ###
    if 'aes_local_key' in ret:
        # 情況1：不用再解密
        print("不用再解密")
        return ret
    else:
        # 情況2：要用dweklxde函數進行解密
        print("要再解密")
        ciphertext = re.search(r"dweklxde\('(?P<content>.*?)'\)",ret).group('content')

    # 再對之後的內容解密
    resp = requests.post("http://127.0.0.1:3000/decode",{
        "a":ciphertext,
    })
    ret = resp.text

    # 情況3：有時需要進行兩次dweklxde解密，因此要判斷一下
    if 'const' not in ret:
        print("二次dweklxde解密")
        resp = requests.post("http://127.0.0.1:3000/decode",{
        "a":str(ret),
        })
        ret = resp.text

    return ret

# 獲取AES、DES的key和iv
def getKeyAndIv(jsCode):
    regx = re.compile(r'const[ ]+([A-z0-9]+)[ ]*=[ ]*"(.*?)"')
    keys = regx.findall(jsCode)
    dict = {}
    for key in keys:
        dict[key[0]] = key[1]
    return dict

# 匹配解密時用到的key、iv
def matchDecodeKeyAndIv(jsCode,keyDict):
    # print(jsCode)
    regx = re.compile(r"data[ ]*=[ ]*BASE64.*?DES.decrypt\(data,(?P<des_key>.*?),(?P<des_iv>.*?)\).*?AES.decrypt\(data,(?P<aes_key>.*?),(?P<aes_iv>.*?)\).*?data[ ]*=[ ]*BASE64",re.S)
    res = regx.search(jsCode)
    des_key = res.group('des_key').strip()
    des_iv = res.group('des_iv').strip()
    aes_key = res.group('aes_key').strip()
    aes_iv = res.group('aes_iv').strip()
    decodeDict = {}
    decodeDict["des_key"] = keyDict[des_key]
    decodeDict["des_iv"] = keyDict[des_iv]
    decodeDict["aes_key"] = keyDict[aes_key]
    decodeDict["aes_iv"] = keyDict[aes_iv]
    return decodeDict

# 匹配加密參數時用到的key、iv
# 順便獲取post請求的參數名(因為會變動)
def matchEncodeKeyAndIv(jsCode,keyDict):
    # print(jsCode)
    dict = {}

    ### 先獲取post取求的參數名
    regx = re.compile(r"\$.ajax\(.*?data:.*?\{(?P<paramName>.*?):(.*?)\}.*?\)",re.S)
    res = regx.search(jsCode)
    paramName = res.group('paramName').strip()
    dict["paramName"] = paramName

    ### 獲取key、iv要分3種情況來處理
    # 1. 冇DES、AES加密，直接返回
    regx = re.compile(r"return function.*?var .*?=.*?'(?P<k>.*?)'.*?'WEB'",re.S)
    res = regx.search(jsCode)
    dict['k'] = res.group('k').strip()

    # 2.只有AES加密：獲取key、iv
    regx = re.compile(r"return function.*?var .*?=.*?'(?P<k>.*?)'.*?'WEB'.*?AES.encrypt\(.*?,(?P<key>.*?),(?P<iv>.*?)\)",re.S)
    res = regx.search(jsCode)
    if res != None:
        print("AES加密")
        key = res.group('key').strip()
        iv = res.group('iv').strip()
        dict["aes_key"] = keyDict[key]
        dict["aes_iv"] = keyDict[iv]
        return dict

    # 3.只有DES加密：獲取key、iv
    regx = re.compile(r"return function.*?var .*?=.*?'(?P<k>.*?)'.*?'WEB'.*?DES.encrypt\(.*?,(?P<key>.*?),(?P<iv>.*?)\)",re.S)
    res = regx.search(jsCode)
    if res != None:
        print("DES加密")
        key = res.group('key').strip()
        iv = res.group('iv').strip()
        dict["des_key"] = keyDict[key]
        dict["des_iv"] = keyDict[iv]
        return dict
    
    return dict

def getParam(encodeDict):
    url = "http://127.0.0.1:3000/getParam"
    mode = key = iv = ""
    if 'aes_key' in encodeDict:
        mode = 'AES'
        key = encodeDict['aes_key']
        iv = encodeDict['aes_iv']
    elif 'des_key' in encodeDict:
        mode = 'DES'
        key = encodeDict['des_key']
        iv = encodeDict['des_iv']
    data = {
        "p1":"GETMONTHDATA",
        "p2":'{"city": "北京"}', # 直接傳dict會有問題(可能係js解析唔到？)
        "k":encodeDict['k'],
        "key":key,
        "iv":iv,
        "mode":mode
    }

    resp = requests.post(url,data)
    # print(resp.text)
    return resp.text

def requestData(data):
    headers = {
        'Accept': '*/*',
        'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
        'Cache-Control': 'no-cache',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Origin': 'http://www.aqistudy.cn',
        'Pragma': 'no-cache',
        'Proxy-Connection': 'keep-alive',
        'Referer': 'http://www.aqistudy.cn/historydata/monthdata.php?city=%E5%8C%97%E4%BA%AC',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/111.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
    }
    resp = requests.post(url='http://www.aqistudy.cn/historydata/api/historyapi.php',data=data,headers=headers,verify=False)
    ret = resp.text
    resp.close()
    return ret

def dataDecode(data,decodeDict):
    url = "http://127.0.0.1:3000/dataDecode"
    
    data = {
        "data":data,
        "aes_key":decodeDict["aes_key"],
        "aes_iv":decodeDict["aes_iv"],
        "des_key":decodeDict["des_key"],
        "des_iv":decodeDict["des_iv"],
    }
    resp = requests.post(url,data)
    print(resp.text)
    resp.close()

def test():
    url = "http://127.0.0.1:3000/decode"

    data = {
        "a":"MTIzNA==",
    }
    resp = requests.post(url,data)
    print(resp.text)


def main():
    indexPage = getIndexPage("http://www.aqistudy.cn/historydata/monthdata.php?city=%E5%8C%97%E4%BA%AC")
    jsUrl = getJsUrl(indexPage)
    jsCode = getJsCode("http://www.aqistudy.cn/historydata/resource/js/",jsUrl)
    decode_jsCode = decodeJsCode(jsCode)
    keyDict = getKeyAndIv(decode_jsCode)
    decodeDict = matchDecodeKeyAndIv(decode_jsCode,keyDict)
    encodeDict = matchEncodeKeyAndIv(decode_jsCode,keyDict)
    param = getParam(encodeDict)

    # print(param)

    data = requestData({encodeDict["paramName"]:param})
    dataDecode(data,decodeDict)


if __name__ == "__main__":
    main()

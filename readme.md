#### [阿里支付](#1)
#### [微信支付](#2)
#### [银联支付](#3)

## Installation
```npm install china-pay```

# <span id=1>阿里支付 </span>
#### [app支付](#11)
#### [回调处理](#12)
#### [提现](#13)


## Prepare
[生成私钥](https://rietta.com/blog/2012/01/27/openssl-generating-rsa-key-from-command/)
[设置私钥](https://docs.open.alipay.com/291/106130)
[将上面生成的私钥生成无密码的私钥](https://rafpe.ninja/2016/08/17/openssl-convert-rsa-key-to-private-key/)

## Importing
```js
const privatePem = fs.readFileSync('private_key.pem');//该私钥为无密码的私钥
const publicPem = fs.readFileSync('public_key.pem');
const alipayJson = {
    app_id: '',  //应用ID
    notify_url: '',//通知地址
};
const key = {
    privateKey: privatePem,//私钥，格式为buffer
    publicKey: publicPem//公钥， 格式为buffer
}
const pay = require('china-pay')('alipay');
//alipayJson， key 必传
const alipay = new pay(alipayJson, key)
```
## Usage

#### <span id=11>app支付(getAppParam)</span>
- app端获取支付需要的参数
```js
let biz_content = {
    out_trade_no: '订单号',
    total_amount: '金额',
    subject: '订单标题',
    body: "商品描述"
}
try{
    //result为移动端需要给支付宝的数据
    let result = await alipay.getAppParam(biz_content)
}catch(err){
    //err
}

```

#### <span id=12>回调处理(verifySign)</span>
```js
try{
    //obj 为支付宝返回的body对象里面的内容
    let result = await alipay.verifySign(obj)
    //res.send("success");如果成功
}catch(err){
    //认证失败
}
```
#### <span id=13>提现(refundTransfer)</span>
```js
try{
    await alipay.refundTransfer({
        out_biz_no :'12124324234',//提现订单
        payee_account:'130*',//支付宝账号
        amount :'0.01',//提款金额
        payee_real_name :'董佳',//支付宝账号对应的真实姓名
        payer_show_name :'欣享车'//支付人的姓名
    });
}catch(err){
    //失败
}

```

# <span id=2>微信支付 </span>
#### [app统一下单接口](#21)
#### [扫码支付](#22)
#### [回调处理](#23)
#### [提现](#23)

## Importing
```js
const wxpayJson = {
    appid: '',  //邮箱里
    mch_id: '',//邮箱里
    notify_url: //邮箱里
};
const key = {
    key:'',//邮箱里
    pfxPath:''//微信证书提现时使用
}
const pay = require('china-pay')('wxpay');
//alipayJson， key 必传
const wxpay = new pay(wxpayJson, key)
```
## Usage

#### <span id=21>app统一下单接口(appUnifiedorder)</span>
```js
    let obj = {
        attach: '12313231',//附加数据（有时候必填）
        body: '测试',
        out_trade_no: '12312324143',
        total_fee: "1"//(支付费用(分))
    }
    try{
        //前端需要的数据
        let result = await wxpay.appUnifiedorder(obj);
    }catch(err){
        console.log(err)
    }
```
#### <span id=22>扫码支付(webUnifiedorder)</span>
```js
    let obj = {
        attach: '12313231',//附加数据（有时候必填）
        body: '测试',
        out_trade_no: '12312324143',
        total_fee: "1"//(支付费用(分))
    }
    try{
        //支付的url码， 该码可以转为二维码
        let result = await wxpay.webUnifiedorder(obj);
    }catch(err){
        console.log(err)
    }
```
#### <span id=22>回调处理(notify)</span>
注： 微信返回的格式是xml格式， 因此先对其进行转换， express可以使用```express-xml-bodyparser```中间件处理
```js
//obj 里面的 key 可以是数组或者字符串
let obj =  {
     appid: [ 'wx7c73ca24*******' ],
     attach: [ '1231323123' ],
    ......
}
//失败则抛出异常， 
try{
    let result = await wxpay.notify(obj)   
}catch(err){
    //
}

//之后需要给wx返回， 返回的参数为“SUCCESS”
// res.set('Content-Type', 'text/xml');
// res.send("SUCCESS")
```
#### <span id=24>提现(transfers)</span>
```js
    obj = {}
    obj.openid = ''
    obj.partner_trade_no = '23234234234'
    obj.desc='test'
    obj.amount = 100;
    try{
        await wxpay.transfers(obj)
    }catch(err){
        //失败抛出异常
    }
```
# <span id=3>银联支付 </span>
#### [获取tn](#31)
#### [回调处理](#32)
## Prepare
- 获取私钥
获取银联以```priv.pfx```结尾的证书后
```js
const pem = require('pem');
const fs = require('fs');
const pfx = fs.readFileSync("/home/dj/priv.pfx");
pem.readPkcs12(pfx, { p12Password: "password" }, (err, cert) => {
    //cert.key就是私钥
    console.log(cert.key)
});

```
- 获取certId
```js
wopenssl = require('wopenssl');
var p12 = wopenssl.pkcs12.extract(__dirname + '/priv.pfx', '761202');
var certs = wopenssl.x509.parseCert(p12.certificate);
//certs里面的Serial就是certId, 但是是16进制的， 然后使用python int("1149699808", 16)将其转换为10进制


```
##### x509常用命令

[openssl pkcs12 -in input.pfx -out mycerts.crt -nokeys -clcerts](https://stackoverflow.com/questions/403174/convert-pfx-to-cer) 将pfx或p12 生成证书。

[openssl pkcs12 -in x.pfx  -nocerts -nodes -passin pass:123456 | openssl rsa -out privkey.pem](https://stackoverflow.com/questions/12420068/creating-rsa-private-key-from-pfx-pkcs-12-file) pfx生成rsa
私钥

[openssl x509 -inform der -in certificate.cer -pubkey -noout > certificate_publickey.pem](https://stackoverflow.com/questions/28060159/how-to-extract-the-rsa-public-key-from-a-cer-and-store-it-in-a-pem-using-opens) cer生成公钥(证书有两种格式， 一种是der， 一种是pem。 der是二进制， 而pem是字符串， 可以使用文本编辑器打开看)

## Importing
```
const key = {
    privateKey:fs.readFileSync('/home/dj/privkey.pem'),
    publicKey:fs.readFileSync('/home/dj/pub.pem')
}
const unionpayJson = {
    merId: "8986101739906**",
    frontUrl: "http://papanda.tk:3100",
    certId: "742461010**"
};

const pay = require('china-pay')('unionpay');
//unionpayJson key 必传
const unionpay = new pay(unionpayJson, key)
```

## Usage

#### <span id=31>获取tn(getTn)</span>
```js
let obj = {
    orderId :'211323213241234321412',
    txnAmt :'1',//(分)
    orderDesc :'这是一个测试'
}
try{
    //result 为tn 前端用来跟银联交互的数据
    let result = await unionpay.getTn(obj);
}catch(err){
    console.log(err)
}
```
#### <span id=32>回调处理(notify)</span>
```js
try{
    //有result则成功
    let result = await unionPay.notify(req.body);
}catch(err){
    
}
//给银联的返回
//res.send('success')
```
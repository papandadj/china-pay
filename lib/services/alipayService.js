//微信支付API
const request = require('request');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const sd = require('silly-datetime');

class alipayService {

    constructor() {
    }

    //app支付所需的固定参数
    async appReduceParams( biz_content) {
        let obj = {};
        obj.method = "alipay.trade.app.pay";
        obj.charset = 'utf-8';
        obj.sign_type = 'RSA2';
        obj.version = '1.0';
        obj.app_id = this.alipayJson.app_id;
        obj.notify_url = this.alipayJson.notify_url;
        obj.timestamp = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
        biz_content.timeout_express = "30";//过期时间
        biz_content.product_code = 'QUICK_MSECURITY_PAY';//销售产品码，商家和支付宝签约的产品码，为固定值QUICK_MSECURITY_PAY
        obj.biz_content = JSON.stringify(biz_content);
        return obj;
    }
    
    //提现所需的固定参
    async refundTransferReduceParams(biz_content) {
        let obj = {};
        let url = "https://openapi.alipay.com/gateway.do?";
        obj.app_id = this.alipayJson.app_id;
        obj.method = "alipay.fund.trans.toaccount.transfer";
        obj.charset = 'utf-8';
        obj.sign_type = 'RSA2';
        obj.timestamp = sd.format(new Date(), 'YYYY-MM-DD HH:mm:ss');
        biz_content.timeout_express = "30";//过期时间
        biz_content.payee_type = "ALIPAY_LOGONID",//支付金额
            biz_content.product_code = 'QUICK_MSECURITY_PAY';//销售产品码，商家和支付宝签约的产品码，为固定值QUICK_MSECURITY_PAY
        obj.biz_content = JSON.stringify(biz_content);
        return obj;
    }

    /**
     * 将对象中的键值由ASCII从大到小排序，并且拼接成字符串 k=v&k1=v1
     * @param {Object} args 
     * @return {String} 
     */
    async obj2keyValue(args) {
        var keys = Object.keys(args);
        keys = keys.sort()
        var newArgs = {};
        keys.forEach(function (key) {
            newArgs[key] = args[key];
        });
        var string = '';
        for (var k in newArgs) {
            string += '&' + k + '=' + newArgs[k];
        }
        string = string.substr(1);
        return string;
    }

    //获取需要签名的字符串
    async getVerifyParams(obj) {
        return new Promise(async (resolve, reject) => {
            resolve(await this.obj2keyValue(obj))
        })
    }

    //支付宝回调签名
    async getVerifyParamsCallback(obj) {
        return new Promise(async (resolve, reject) => {
            let verifyParams = JSON.parse(JSON.stringify(obj))
            delete verifyParams.sign;
            delete verifyParams.sign_type;
            resolve(await this.obj2keyValue(verifyParams))
        })
    }

    /**
     * 支付宝签名
     * @param {String} preStr 需要签名的签名的数据
     * @return {String} 签名后的字符串 
     */
    async getSign(preStr) {
        let keyStr = this.key.privateKey.toString();
        let sign = crypto.createSign('RSA-SHA256');
        sign.update(preStr);
        sign = sign.sign(keyStr, 'base64');
        return encodeURIComponent(sign)
    }

    /**
     * 验签
     * @param {Object} 支付宝数据
     * @return {Bool} 
     */
    async verifySignBase(params) {
        return new Promise(async (resolve, reject) => {
            try {
                let publicKey = this.key.publicKey.toString();
                let preStr = await this.getVerifyParamsCallback(params);
                let sign = params['sign'] ? params['sign'] : "";
                let verify = crypto.createVerify('RSA-SHA256');
                verify.update(preStr);
                if(verify.verify(publicKey, sign, 'base64')){
                    resolve()
                }else{
                    reject('公钥验证失败')
                }
            } catch (err) {
                reject(false)
            }
        })
    }
 
}

module.exports = alipayService;
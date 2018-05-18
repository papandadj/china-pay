'use strict'
const request = require('request');
const fs = require('fs');
const crypto = require('crypto');
const iconv = require("iconv-lite");
const sd = require('silly-datetime');

class unionpayService  {


    /**
     * 银联支付-app控件支付-消费类交易，获取参数
     * @param {Object} obj
     * - orderId 订单id
     * - txnAmt 金额(分)
     * - orderDesc 商品描述
     * @return tn 交易流水号 出错为null
     */
    async getAppArgs(obj) {
        return new Promise(async (resolve, reject) => {
            let formData = await this.buildParams(obj);
            request.post(
                "https://gateway.95516.com/gateway/api/appTransReq.do",
                { form: formData },
                function (error, response, body) {
                    if (!error && response && response.statusCode == 200) {
                        var tn = null;
                        var s = body.split('&');
                        for (var i in s) {
                            var a = s[i];
                            var k = a.split('=');
                            if (k[0] == 'tn') {
                                tn = k[1] || null;
                                break;
                            }
                        }
                        if(tn){
                            resolve(tn);
                        }else{
                            reject(body)
                        }
                    } else {
                        reject(error)
                    }
                }
            );
        })
    };


    /**
     * 生成银联支付需要的参数
     * @param {*} obj 
     * - {String} orderId 订单id
     * - {Integer} txnAmt 金额(分)
     * - {String} orderDesc app控件显示的汉字
     * @return {Object}
     */
    async buildParams(obj) {
        var objReturn = {
            version: '5.0.0',
            encoding: 'UTF-8',
            signMethod: "01",
            txnType: "01",//固定
            txnSubType: "01",//固定
            bizType: "000201",//产品类型，000201：B2C网关支付
            accessType: "0",//0：商户直连接入1：收单机构接入
            currencyCode: '156',//（人民币） 固定：156
            channelType: '08',//05：语音 07：互联网 08：移动
            txnTime: sd.format(new Date(), 'YYYYMMDDhhmmss'),//交易时间， 20151118100505
            merId: this.unionpayJson.merId,
            frontUrl: this.unionpayJson.frontUrl,
            certId: this.unionpayJson.certId,
            orderId: obj.orderId,
            txnAmt: obj.txnAmt + ''
        };
        if (obj.orderDesc) {
            objReturn.orderDesc = obj.orderDesc;
        }
        var preString = this.createLinkString(objReturn, true);
        preString = iconv.encode(preString, 'utf-8');

        var sha1 = crypto.createHash('sha1');
        sha1.update(preString, 'utf8');
        var ss1 = sha1.digest('hex');

        //私钥签名
        var sign = crypto.createSign('RSA-SHA1');
        sign.update(ss1);

        var sig = sign.sign(this.key.privateKey, 'base64');
        objReturn.signature = sig;
        return objReturn;

    };

    //验签
    async verify(params) {
        var signature_str = params.signature;
        params = this.filterPara(params);
        var preString = this.createLinkString(params, false);
        var preString = iconv.encode(preString, 'utf-8');

        //sha1
        var sha1 = crypto.createHash('sha1');
        sha1.update(preString);
        var ss1 = sha1.digest('hex');

        //公钥验签
        var verifier = crypto.createVerify("RSA-SHA1");
        verifier.update(ss1);
        var vs = verifier.verify(this.key.publicKey, signature_str, "base64");

        return vs;
    };


    /**
     * 
     * @param {*} params 
     * @param {*} encode 
     */
    createLinkString(params, encode) {
        var str = '', ks = Object.keys(params).sort();
        for (var i = 0; i < ks.length; i++) {
        var k = ks[i];
        if (encode == true) {
            k = encodeURIComponent(k);
        }
        if (str.length > 0) {
            str += '&';
        }
        if (k != null && k != undefined && k != '') {//如果参数的值为空不参与签名；
            str += k + '=' + params[k];
        }
        }
        return str;
    };

}

module.exports = unionpayService;
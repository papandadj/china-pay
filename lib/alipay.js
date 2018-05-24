const request = require("request");
const alipayService = require('./services/alipayService');

class alipay extends alipayService {

    constructor(alipayJson, key) {
        super();
        this.alipayJson = alipayJson;
        this.key = key;
        this.getAppParam = this.getAppParam.bind(this);
        this.verifySign = this.verifySign.bind(this);
        this.refundTransfer = this.refundTransfer.bind(this);
    }

    /**
     * alipay 获取app支付的请求参数
     * @param {*} obj(下列参数必填)
     * biz_content {Object}
     * -out_trade_no： 订单号
     * -total_amount： 支付金额
     * -subject： 订单标题
     * -body： 商品描述
     * @return {String} 
     */
    async getAppParam(biz_content) {
        return new Promise(async (resolve, reject) => {
            let obj = await this.appReduceParams(this.alipayJson, biz_content)
            let myParam = await this.getVerifyParams(obj);
            let mySign = await this.getSign(myParam);
            myParam = encodeURI(myParam);
            let result = myParam + '&sign=' + mySign;
            resolve(result);
        })
    }

    /**
     * 支付宝验签
     * @param {Object} obj 支付宝回调的参数
     * @return {Bool} 
     */
    async verifySign(obj) {
        return new Promise(async (resolve, reject) => {
            let verifyResult = await this.verifySignBase(obj);
            if (!verifyResult) {
                reject('认证失败')
            }
            if (obj.trade_status == 'TRADE_SUCCESS' || obj.trade_status == 'TRADE_FINISHED') {
                resolve(true)
            } else {
                reject('认证失败')
            }
        })
    }

    /**
     * 支付宝提现
     * @param {Object} biz_content(下列参数必填)
     * -out_biz_no 订单号
     * -payee_account 支付宝帐号
     * -amount 费用(元)
     * -payee_real_name 真实姓名
     * -payer_show_name = 转账的人,
     * @return {Bool} 
     */
    async refundTransfer(biz_content) {
        return new Promise(async (resolve, reject) => {
            let obj = await this.refundTransferReduceParams(biz_content)
            let myParam = await this.getVerifyParams(obj);
            let mySign = await this.getSign(myParam);
            myParam = encodeURI(myParam);
            let last = myParam + '&sign=' + mySign;
            let final = "https://openapi.alipay.com/gateway.do?" + last;
            request.get({ url: final }, function (err, response, body) {
                if (err) reject(err);
                var parseBody = JSON.parse(body);
                if (parseBody && parseBody.alipay_fund_trans_toaccount_transfer_response && parseBody.alipay_fund_trans_toaccount_transfer_response.code == '10000') {
                    resolve(true)
                } else {
                    reject(false)
                }
            })
        })
    }
}

module.exports = alipay;
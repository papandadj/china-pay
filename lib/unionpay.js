const unionpayService = require('./services/unionpayService');

class unionpay extends unionpayService {

    constructor(unionpayJson, key) {
        super();
        this.unionpayJson = unionpayJson;
        this.key = key;
        this.getTn = this.getTn.bind(this);
        this.notify = this.notify.bind(this);
    }

    /**
     * 银联支付-app控件支付-消费类交易，获取参数
     * @param {Object} obj
     * - orderId 订单id
     * - txnAmt 金额(分)
     * - orderDesc 商品描述
     * @return tn 交易流水号 
     */
    async getTn(obj) {
        return new Promise(async (resolve, reject) => {
            try {
                let tn = await this.getAppArgs(obj);
                resolve(tn)
            } catch (err) {
                reject(err)
            }
        })
    }

    /**
     * 银联验签
     * @param {Object} obj 银联的回调参数
     * @return {Bool} true则签名成功
     */
    async notify(obj) {
        return new Promise(async (resolve, reject) => {
            let result = await this.verify(req.body);
            if (!result) {
                reject('签名失败')
            }
            let transStatus = req.body.respCode;
            if ("" != transStatus && "00" == transStatus) {
                resolve(true)
            } else {
                reject('返回数据出错')
            }
        })
    }

}

module.exports = unionpay;
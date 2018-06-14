const wxpayService = require('./services/wxpayService');

class wxpay extends wxpayService {

    constructor(wxpayJson, key) {
        super();
        this.wxpayJson = wxpayJson;
        this.key = key;
        this.appUnifiedorder = this.appUnifiedorder.bind(this);
        this.webUnifiedorder = this.webUnifiedorder.bind(this);
        this.notify = this.notify.bind(this);
    }

    /**
     * app统一订单接口
     * @param {*} obj(下列参数必填)
     * -attach = "1276687601" 附加数据（有时候必填）
     * -body = '测试'(用户支付时显示的数据)
     * -out_trade_no = '123456789'(订单id)
     * -total_fee = 1 (支付费用(分))
     */
    async appUnifiedorder(obj) {
        return new Promise(async (resolve, reject) => {
            let prepay_id;
            try {
                prepay_id = await this.order(obj);
            } catch (err) {
                reject(err);
            }
            if (prepay_id) {
                resolve(await this.appResign(prepay_id));
            } else {
                reject('获取prepay_id失败');
            }
        })
    }

    /**
     * web统一订单接口
     * @param {*} obj(下列参数必填)
     * -attach = "1276687601" 附加数据（有时候必填）
     * -body = '测试'(用户支付时显示的数据)
     * -out_trade_no = '123456789'(订单id)
     * -total_fee = 1 (支付费用(分))
     */
    async webUnifiedorder(obj) {
        return new Promise(async (resolve, reject) => {
            try {
                let code_url = await this.webOrder(obj);
                resolve(code_url)
            } catch (err) {
                reject(err)
            }
        })
    }

    /**
     * @desc:企业转账
     * @param: {Object} obj
     * -openid wx 的 openid
     * -partner_trade_no = '123456789'(订单id)
     * -desc  原因 
     * -amount = 1 (支付费用(分))
     * @return: {Bool} 转账成功还是失败
     */
    async transfers(obj) {
        return new Promise(async (resolve,reject)=>{
            try{
                resolve(await this.transfersBase(obj))
            }catch(err){
                reject(err)
            }
        })        
    }

    /**
     * @desc:微信回调
     * @param: {Object} data 微信回调的内容由 xml 转换为 obj
     * @return: 
     */
    async notify(data) {
        return new Promise(async (resolve, reject) =>{
            let result = await this.verifySign(data);
            if (result && data && data.return_code == "SUCCESS") {
                resolve(true)
            }else{
                reject({签名结果:result, 回调数据:data})
            }
        })
    }

}

module.exports = wxpay;
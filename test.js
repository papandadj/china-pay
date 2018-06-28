const wxpayJson = {
  appid: 'wx7c73ca24eae946d3',  //邮箱里
  mch_id: '1494475232',//邮箱里
  notify_url:'' //邮箱里
};
const key = {
  key:'YfBk537jVM7gNpbcyQhfh5sb8tzV63rH',//邮箱里
  pfxPath:'./apiclient_cert.p12'//微信证书提现时使用
}
const pay = require('./index')('wxpay');
//alipayJson， key 必传
const wxpay = new pay(wxpayJson, key);

( async function (){
  try{
    let c = await wxpay.getTransferInfo('1820180621024147148636411')
    console.log(c)
  }catch(er)
  {
    console.log(er)
  }
})();
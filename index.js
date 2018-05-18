const path = require('path')
const optionsType = ['alipay', 'wxpay', 'unionpay'];

module.exports = (option) =>{
    if(!optionsType.includes(option)){
        return new Error('请选择正确的支付类型')
    }
    return require(path.join(__dirname, 'lib', option));
}
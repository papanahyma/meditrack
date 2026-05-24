import webpush from 'web-push'

const keys = webpush.generateVAPIDKeys()

console.log("=================================")
console.log("PUBLIC KEY:")
console.log(keys.publicKey)
console.log("\nPRIVATE KEY:")
console.log(keys.privateKey)
console.log("=================================")
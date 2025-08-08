// Test file with sensitive data to test security features
const apiKey = "sk-1234567890abcdef1234567890abcdef";
const databaseUrl = "mongodb://user:password@localhost:27017/mydb";
const jwtToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c";

// Some malicious patterns
eval("console.log('malicious code')");
const fs = require('fs');
fs.unlinkSync('important-file.txt');

// Normal code
function hello() {
    return "Hello World";
}

console.log(hello());

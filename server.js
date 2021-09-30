const http = require("http")
const fs = require("fs")
const queryString = require("querystring")
var uniqid = require('uniqid');
const url = require("url")

const server = http.createServer()


const checkURLExists = (url) => {
    return new Promise((resolve, reject) => {
        fs.readFile("urls.json", "utf-8", (err, result) => {
            if (err) {
                reject("ISE")
            } else {

                if(result){
                    let urlArr = result.trim().split("\n")
                    let urlResult = urlArr.find(item => JSON.parse(item).ogUrl === url)
                    console.log(JSON.parse(urlResult));
                    if (urlResult) {
                        resolve(JSON.parse(urlResult))
                    } else {
                        reject("ISE")
                    }
                }else{
                    reject("ISE")
                }
                
    
    
            }
        })
    })
    
}

server.on("request", (req, res) => {
    if (req.url === "/") {
        var rs = fs.createReadStream("index.html")
        rs.on("error", function () {
            res.writeHead(500)
            res.end("Theres is error while streaming the page")
        })
        res.setHeader("Content-Type", "text/html");
        rs.pipe(res)

        // var rs = fs.readFileSync("index.html")
        // res.writeHead(200,{'Content-type': 'text/html'});
        // res.end(rs)
    }
    else if (req.url === "/contact") {
        var rs = fs.createReadStream("contact.html")
        rs.on("error", function () {
            res.writeHead(500)
            res.end("Theres is error while streaming the page")
        })
        res.writeHead(200, { 'Content-type': 'text/html' });
        rs.pipe(res)
    }
    else if (req.url === "/message" && req.method === "POST") {

        // name=abhishek&email=ag@gmail.com&message=testing
        let buffer = ""

        req.on("data", chunks => {
            buffer += chunks
        })

        req.on("end", () => {
            let data = queryString.parse(buffer)
            let string = JSON.stringify(data) + "\n"
            fs.appendFile("message.json", string, function (err, result) {
                if (err) {
                    res.statusCode(500)
                    res.end("ISE: Error while appending data to file ")
                }
                else {
                    res.writeHead(301, { location: "/" })
                    res.end("Data Seved Succesfully")
                }
            })
        })

    }
    else if (req.url === "/short" && req.method === "GET") {

        let rs = fs.createReadStream("./short.html")
        rs.on("error", (err) => {
            res.statusCode = 500
            res.end("ISE: Error while rendering short url page")
        })

        rs.pipe(res)

    }
    else if (req.url === "/createshort" && req.method === "POST") {

        // name=abhishek&email=ag@gmail.com&message=testing
        let buffer = ""

        req.on("data", chunks => {
            buffer += chunks.toString()
        })

        req.on("end", () => {

            let dataObj = queryString.parse(buffer)
            console.log("dataObj", dataObj.url);


            checkURLExists(dataObj.url).then(result => {
                console.log({result});
                res.end(result.shortUrl)
            }).catch(err => {
                let urlId = uniqid.time()
                let shortUrl = `http://localhost:3000/${urlId}`

                let urlObj = {
                    id: urlId,
                    shortUrl: shortUrl,
                    ogUrl: dataObj.url
                }

                let urlObjString = JSON.stringify(urlObj)

                fs.appendFile("urls.json", urlObjString + "\n", (err, result) => {
                    if (err) {
                        res.end("IES")
                    } else {
                        res.end(shortUrl)
                    }
                })
            })

        })

    }
    else if (req.url && req.method === "GET") {

        let urlId = req.url.split("/")[1]
        fs.readFile("urls.json", "utf-8", (err, result) => {
            if (err) {
                res.end("ISE")
            } else {
                let urlArr = result.trim().split("\n")
                let urlResult = urlArr.find(item => JSON.parse(item).id === urlId)
                if (urlResult) {
                    res.writeHead(301, { location: JSON.parse(urlResult).ogUrl })
                    res.end("Done")
                } else {
                    res.end(JSON.stringify("NOT FOUND: NO SUCH URL"))
                }


            }
        })

    }
    else {
        res.writeHead(400)
        res.end("Page Not Found")
    }
})


server.listen(3000, () => {
    console.log("Server is running on port", 3000);
})


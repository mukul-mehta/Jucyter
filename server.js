var express = require("express");
var app = express();
var http = require("http").createServer(app);
var io = require("socket.io")(http);
require("dotenv").config();
var fs = require("fs");
const exec = require('child_process').exec;



app.use(express.json());
app.use(express.urlencoded({ extended: false }));

function checkForChanges(path) {

    fs.watch(path, { BufferEncoding: true }, (eventType, filename) => {

        console.log(eventType);
        compile(path);
    })

}

function compile(path) {

    var ar = path.split(".");
    // console.log(ar);
    var compiler_keyword;
    if( ar[ ar.length -1 ] == "c" )
        compiler_keyword = "gcc ";
    else
        compiler_keyword = "g++ ";

    // console.log(compiler_keyword);


    exec( compiler_keyword + path , (error1, stdout, stderr) => {         // compiler_keyword + path

        if(error1)
            console.log("err: ", error1);

        if(!error1 && !stderr){

            exec("./a.out < input.txt", (error, stdout, stderr) => {

                if(error)
                    console.log("err: ", error);

                console.log("stderr: ", stderr);

                console.log("stdout: ", stdout);

                io.emit("output update", {
                    error: stderr,
                    output: stdout
                });


            });

        }else{

            console.log("stderr: ", stderr);

            io.emit("compilation error", {
                error: stderr
            });

        }


    });


}

function runProgram() {

    exec("./a.out < input.txt", (error, stdout, stderr) => {

        if(error)
            console.log("err: ", error);

        console.log("stderr: ", stderr);

        console.log("stdout: ", stdout);

        io.emit("output update", {
            error: stderr,
            output: stdout
        });


    })



}


app.get("/", (req, res) => {

    res.sendFile(__dirname + "/start.html");

});

app.get("/home", (req, res) => {

    res.sendFile(__dirname + "/home.html");

})

app.post("/filepath", (req, res) => {

    if( fs.existsSync(req.body.filepath) ){
        console.log(req.body);
        res.send("success!");
        checkForChanges(req.body.filepath);
        process.env.filep = req.body.filepath;
    }
    else
        res.send("Invalid Path, Reload to try again!!!");

})

io.on('connection', ( socket ) => {

    console.log("client connected");

    socket.on('disconnect', () => {

        console.log("client disconnected ");

    });

    socket.on('change in input', (inp) => {

        // console.log(inp);
        // console.log("here");
        // runProgram(process.env.filep, inp);
        fs.writeFileSync(__dirname + "/input.txt", inp, 'utf8');
        runProgram();

    });

});




app.get("/scripts/:name", (req, res) => {

    res.sendFile(__dirname + "/scripts/" + req.params.name);

})

http.listen(2000, () => {

    console.log("server running....");

})
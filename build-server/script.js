const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');  // it will help to get the content type of the file that is being uploaded
const Redis = require('ioredis');


const redis = new Redis('')

const s3Client = new S3Client({
    region: 'eu-north-1',
    credentials: {
        accessKeyId: '',
        secretAccessKey: ''
    }
});

const PROJECT_ID = process.env.PROJECT_ID;

function publishLog(log) {
    redis.publish(`logs:${PROJECT_ID}`, JSON.stringify({log}));
}

async function init() {
    console.log('Building server...');
    publishLog('Building server...');
    const outDirPath = path.join(__dirname, 'output');
    const p = exec(`cd ${outDirPath} && npm install && npm run build`);

    p.stdout.on('data', function (data) {
        console.log(data.toString());
        publishLog(data.toString());
    });

    p.stderr.on('error', function (data) {
        console.log('Error', data.toString());
        publishLog('Error', data.toString());
    });

    p.on('close', async function () {
        console.log('Server build completed');
        publishLog('Server build completed');
        // const distFolderPath = path.join(__dirname, 'output', 'dist')    //for vite
        const distFolderPath = path.join(__dirname, 'output', 'build')    //for create-react-app
        const distFolderContents = fs.readdirSync(distFolderPath, { recursive: true })  // it will read all the files in the dist folder

        

        // Read the files and upload to the S3 bucket
        for (const file of distFolderContents) {
            const filePath = path.join(distFolderPath, file);
            if (fs.lstatSync(filePath).isDirectory()) continue;   // Check if this is a file, not a folder

            publishLog(`Uploading file ${file}`);

            const command = new PutObjectCommand({
                Bucket: 'vercel-mine',
                Key: `__output/${PROJECT_ID}/${file}`,
                Body: fs.readFileSync(filePath),
                ContentType: mime.lookup(filePath)
            });

            try {
                await s3Client.send(command);
                console.log(`Uploaded file ${filePath} to S3 bucket`);
                publishLog(`Uploaded file ${filePath}`);
            } catch (error) {
                console.error(`Error uploading file ${filePath}:`, error);
                publishLog(`Error uploading file ${filePath}: ${error}`);
            }
        }
        publishLog('Done.....');
        console.log('Done uploading files to S3 bucket');
    });
}

init();

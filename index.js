const aws      = require("aws-sdk");
const Readable = require("stream").Readable;
const zlib     = require("zlib");

const s3  = new aws.S3();
const rds = new aws.RDS();

function today() {
  const n = new Date();

  return `${n.getFullYear()}-${n.getMonth() + 1}-${n.getDate()}`
}

exports.handler = function(event, context, callback) {
  const instance = event.instance;
  const s3bucket = event.s3bucket;
  const s3prefix = `${event.s3prefix}${instance}/${today()}/`;

  rds.describeDBLogFiles({
    DBInstanceIdentifier: instance
  }).promise().then((data) => {

    data.DescribeDBLogFiles.forEach((file) => {

      const filename = file.LogFileName;

      rds.downloadDBLogFilePortion({
        DBInstanceIdentifier: instance,
        LogFileName: filename,
      }).promise().then((data) => {

        const logStream = new Readable();
        logStream.push(data.LogFileData);
        logStream.push(null);
        const gzStream = logStream.pipe(zlib.createGzip());

        s3.upload({
          Body: gzStream,
          Bucket: s3bucket,
          Key: `${s3prefix}${filename}.gz`,
        }).promise().then((data) => {
          console.log(data);
        }).catch(err => console.error(err));

      }).catch(err => console.error(err));

    });

  }).catch(err => console.error(err));
};

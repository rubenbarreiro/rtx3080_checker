const Imap = require("imap");
const inspect = require("util").inspect;
const simpleParser = require("mailparser").simpleParser;
const to = require("await-to-js").default;

class ImapClient {
  openBox(client, name) {
    return new Promise((resolve, reject) => {
      client.openBox(name, false, function (err) {
        if (err) {
          return reject();
        }

        return resolve();
      });
    });
  }

  search(client, subject) {
    return new Promise((resolve, reject) => {
      client.search([["SUBJECT", subject]], function (err, ids) {
        if (err || !ids || !ids.length) {
          return reject("No newegg mails found");
        }

        return resolve(ids);
      });
    });
  }

  deleteMessage(client, id) {
    return new Promise((resolve, reject) => {
      client.setFlags(id, "Deleted", function (err) {
        if (err) {
          return reject(err);
        }
        return resolve();
      });
    });
  }

  connectAndSearch() {
    let me = this;
    return new Promise((resolve, reject) => {
      let newEggCode = "";
      const imap = new Imap({
        user: process.env.NEWEGG_ACCOUNT_EMAIL,
        password: process.env.GOOGLE_IMAP_PASSWORD,
        host: "imap.gmail.com",
        port: 993,
        tls: true,
        tlsOptions: {
          rejectUnauthorized: false,
        },
      });

      imap.once("ready", async function () {
        const [errBox] = await to(me.openBox(imap, "INBOX"));
        if (errBox) {
          return reject(errBox);
        }

        const [errSearch, ids] = await to(
          me.search(imap, "Newegg Verification Code")
        );
        if (errSearch) {
          imap.end();
          return reject(errSearch);
        }

        var f = imap.fetch([ids[0]], {
          bodies: "",
        });

        f.on("message", function (msg, seqno) {
          // console.log("Message #%d", seqno);
          var prefix = "(#" + seqno + ") ";

          msg.on("body", function (stream, info) {
            simpleParser(stream, async (err, mail) => {
              // console.log(prefix + mail.subject);
              // console.log(prefix + mail.text);
              const code = mail.text.match(/website:\s*\d+/);
              // await me.deleteMessage(imap, ids[0]);
              if (!code) {
                // await me.deleteMessage(imap, ids[0]);
                imap.end();
                return reject("could not get code from email");
              }

              newEggCode = code[0].replace(/\D+/, "");
              // await me.deleteMessage(imap, ids[0]);
            });
          });

          /*msg.once("attributes", function (attrs) {
            console.log(prefix + "Attributes: %s", inspect(attrs, false, 8));
          });*/

          msg.once("end", function () {
            me.deleteMessage(imap, ids[0]);
            console.log(prefix + "Finished");
          });
        });

        f.once("error", function (err) {
          console.log("Fetch error: " + err);
        });
        f.once("end", function () {
          console.log("Done fetching all messages!");
          imap.end();
        });
      });

      imap.once("error", function (err) {
        reject("could not open imap connection", err);
      });

      imap.once("end", function () {
        console.log("Connection ended");
        resolve(newEggCode);
      });

      imap.connect();
    });
  }
}

module.exports = new ImapClient();

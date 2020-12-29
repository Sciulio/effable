module.exports = {
  isIndexable: ({ metadata: { robots } }) => !robots || !~robots.indexOf("noindex") && !~robots.indexOf("no-index"),
  convertIoTimestamp: tsMs => tsMs // new Date(tsMs).toString("yyyy-MM-dd").split("T")[0];
}
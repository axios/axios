// Mock the list of users.
var people = [
  {
    "name": "Matt Zabriskie",
    "github": "mzabriskie",
    "twitter": "mzabriskie",
    "avatar": "199035"
  },
  {
    "name": "Ryan Florence",
    "github": "rpflorence",
    "twitter": "ryanflorence",
    "avatar": "100200"
  },
  {
    "name": "Kent C. Dodds",
    "github": "kentcdodds",
    "twitter": "kentcdodds",
    "avatar": "1500684"
  },
  {
    "name": "Chris Esplin",
    "github": "deltaepsilon",
    "twitter": "chrisesplin",
    "avatar": "878947"
  }
];

module.exports = function (req, res) {
  // We're going to respond using JSON format.
  res.writeHead(200, {
    'Content-Type': 'text/json'
  });
  // Convert 'people' object into string before sending the response.
  res.write(JSON.stringify(people));
  res.end();
};

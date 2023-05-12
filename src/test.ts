import Soundcloud from "soundcloud.ts";

const sc = new Soundcloud();

sc.tracks
  .searchV2({
    q: 'thấy chưa'
  })
  .then(results => {
    console.log(results.collection.shift())
  })
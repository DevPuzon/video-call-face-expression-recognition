async function main() {
    setInterval(() => {
      var vids = document.getElementsByClassName("video-main");
      for (let vid of vids) {
        let hasVideo = vid.innerHTML.includes("video");
        if (!hasVideo) {
          vid.remove();
        } 
      }
    }, 1000);
  }
  main();
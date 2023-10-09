# PBJS Debugger

PBJS Debugger is a tool to debug pages with Prebid.js + Google Publisher Tag implemented.

# DEMO

![prebid example page](https://i.gyazo.com/7427532e176d83d09014cda955cca4cd.png)

### Error

![Error](https://i.gyazo.com/7725d6e2034f53ea3555a7dc3deccd42.png)

### Prebid Config

![Prebid Config](https://i.gyazo.com/df33fc76c33b4d88d9602b2e6e08081a.png)

### Show All Bids

![Show All Bids](https://i.gyazo.com/cea5f25e4b47d785b935b56226884d72.png)

### AdUnit Event Log

![AdUnit Event Log](https://i.gyazo.com/805f6527da44e4190379d7cd6e496af6.png)

# Usage

### Snippets

Open the Chrome Dev Tools.
In the Sources tab, next to Content Scripts, click the » button and you can add Snippets.

```js
(async function () {
  function importTag() {
    const scriptEl = document.createElement("script");
    scriptEl.src = "https://katsuo5.github.io/pbjs-debugger/index.min.js";
    scriptEl.async = true;
    document.getElementsByTagName("head")[0].appendChild(scriptEl);
  }

  async function waitForTimeout(milliseconds) {
    return new Promise((r) => setTimeout(r, milliseconds));
  }

  googletag.openConsole();

  await waitForTimeout(1000);

  if (!window.pbjsDebugger) {
    importTag();
  } else {
    window.pbjsDebugger.printSummary();
  }
})();
```

# Note

# License

[MIT license](https://en.wikipedia.org/wiki/MIT_License).

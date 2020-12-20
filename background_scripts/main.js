// Need to be able to access this regardless of the message.
let mintTab;

// The key of the handler should match the request.event value
const eventHandlers = {
  "robinhood-login-needed": ({ sender }) => {
    chrome.tabs.sendMessage(mintTab, {
      status: "You need to log in to Robinhood",
      link: "https://robinhood.com/login?redirectMint=true",
      linkText: "Login",
      persistent: true,
      newTab: true,
    });
    chrome.tabs.remove(sender.tab.id);
  },
  "robinhood-login-success": ({ sender }) => {
    chrome.tabs.sendMessage(mintTab, { shouldReload: true });
    chrome.tabs.remove(sender.tab.id);
  },
  "robinhood-portfolio-scraped": ({ request }) => {
    // Trigger the Mint portfolio update content script
    chrome.tabs.create(
      {
        url:
          "https://mint.intuit.com/settings.event?filter=property&addRobinhood=true",
        active: false,
        openerTabId: mintTab,
      },
      (tab) => {
        chrome.tabs.sendMessage(tab, {
          uninvested_cash: request.uninvested_cash,
          total_market_value: request.total_market_value,
        });
      }
    );
    chrome.tabs.remove(sender.tab.id);
  },
  "mint-force-sync": () => {
    // Trigger the Robinhood sync content script
    chrome.tabs.create({
      url: "https://robinhood.com/account?mintRobinhood=true",
      active: false,
      openerTabId: mintTab,
    });
  },
  "mint-robinhood-setup-complete": () => {
    chrome.storage.sync.set({
      syncTime: "1970-01-01Z00:00:00:000",
    });
    // TODO: trigger first sync?
  },
  "mint-sync-complete": () => {
    chrome.storage.sync.set({ syncTime: new Date().toString() });
    chrome.tabs.sendMessage(mintTab, {
      status: "Sync Complete! Reload to see the change.",
      link: "/overview.event",
      linkText: "Reload",
      persistent: true,
    });
  },
  "mint-opened": ({ sender }) => {
    // Store a reference to the mint tab to be able to show the notifications
    mintTab = sender.tab.id;
    chrome.storage.sync.get("syncTime", ({ syncTime }) => {
      if (!syncTime) {
        // Sync has not been set up
        chrome.tabs.sendMessage(mintTab, {
          status: "Robinhood account is not set up in Mint",
          persistent: true,
          link: "https://mint.intuit.com/addprovider.event?addRobinhood=true",
          linkText: "Set up",
        });
      } else {
        const syncTimeParsed = new Date(syncTime);
        const currentTime = new Date();
        const differenceMilliseconds = currentTime - syncTimeParsed;
        const differenceHours = Math.floor(
          (differenceMilliseconds % 86400000) / 3600000
        );
        if (differenceHours >= 1) {
          chrome.tabs.sendMessage(mintTab, {
            status: "Syncing Mint with Robinhood.",
            persistent: true,
          });

          // Trigger the Robinood sync content script
          chrome.tabs.create({
            url: "https://robinhood.com/account?mintRobinhood=true",
            active: false,
            openerTabId: mintTab,
          });
        } else {
          chrome.tabs.sendMessage(mintTab, {
            status: "Sync performed in the last hour. Not syncing.",
            link:
              "https://mint.intuit.com/overview.event?forceRobinhoodSync=true",
            linkText: "Sync",
            persistent: false,
          });
        }
      }
    });
  },
};

const messageListener = (request, sender, sendResponse) => {
  eventHandlers[request.event]({ request, sender });
};

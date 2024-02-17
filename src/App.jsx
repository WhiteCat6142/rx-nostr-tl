import './App.css'

import { createEffect, createSignal, For, Show, onCleanup } from "solid-js";
import { createStore } from "solid-js/store";

import { createRxNostr, createRxForwardReq, createRxBackwardReq } from "rx-nostr";
import { reduce } from 'rxjs';
import { themeChange } from 'theme-change'

import sanitizeHtml from 'sanitize-html'


function createLocalStore(initState) {
  const [state, setState] = createStore(initState);
  if (localStorage.comments) setState(JSON.parse(localStorage.comments));
  //createEffect(() => (localStorage.comments = JSON.stringify(state)));
  return [state, setState];
}

const [newTitle, setTitle] = createSignal("");

const [comments, setComments] = createLocalStore([]);


const createRouteHandler = () => {
  const [location, setLocation] = createSignal(window.location.hash);
  window.addEventListener("hashchange", () => setLocation(window.location.hash));
  onCleanup(() => window.removeEventListener("hashchange", locationHandler));
  return location;
}

const location = createRouteHandler();

const Commdom = (props) => {
  let str = sanitizeHtml(props.content.trim());
  const urlR = /https:?\/\/[0-9.\-A-Za-z]+\/\S*/g;
  const urls = str.match(urlR);
  const replaced = [];
  for (const t of props.tags) {
    if (t[0] === "r" && (t[1].startsWith("http://") || t[1].startsWith("https://"))) {
      const s = sanitizeHtml(t[1]);
      replaced.push(s);
      str = str.replace(s, `<a href=${t[1]}>${s}</a>`);
    }
    if (t[0] === "emoji" && (t[2].startsWith("http://") || t[2].startsWith("https://"))) {
      replaced.push(t[2]);
      str = str.replace(`:${t[1]}:`, `<img src=${t[2]} class="m-0 p-0 border-none max-h-6" />`);
    }
    if (t[0] === "t"){
      str = str.replace("#"+t[1], `<a href=#${t[1]}>#${t[1]}</a>`);
    }
  }
  if (!!urls) {
    for (const url of urls) {
      if (replaced.every(t => (!url.startsWith(t)))) {
        console.log(url);
        str = str.replace(url, `<a href=${url}>${url}</a>`);
      }
    }
  }
  return (<div innerHTML={str}></div>);
};

const Comm = (props) => {
  return (
    <For each={comments.filter(comment => { return (!location() || ((comment.content.includes(window.location.hash)))) })}>
      {(comment, _i) => {
        return (
          <div class="chat chat-start md:text-lg">
            <div class="font-body chat-bubble whitespace-pre-wrap break-all">
              {Commdom(comment)}
            </div>
            <div class="chat-footer">
              <button
                class="btn btn-sm"
                onClick={() => {
                  rxNostr.send({
                    kind: 7,
                    content: "🤙",
                    tags: [["e", comment.id], ["p", comment.pubkey]]
                  });
                }
                }
              >
                &#x1f919;
              </button>
              {new Date(comment.created_at * 1000).toLocaleTimeString('en-UK')}
            </div>
          </div>
        )
      }}
    </For>
  );
};


const App = () => {
  const addComment = (e) => {
    e.preventDefault();
    const loc = location();
    if (!loc) {
      rxNostr.send({
        kind: 1,
        content: newTitle(),
      });
    } else {
      rxNostr.send({
        kind: 1,
        content: newTitle() + " " + loc,
      });
    }
    setTitle("");
  };

  createEffect(() => {
    themeChange(false)
  })

  return (
    <>
      <div>
        <h3>Simple Comments Example</h3>
        <form onSubmit={addComment}>
          <input
            placeholder="enter a comment"
            required
            value={newTitle()}
            class="input input-bordered w-full max-w-xs"
            onInput={(e) => setTitle(e.currentTarget.value)}
          />
          <button class="btn">+</button>
        </form>
        <button class="btn" data-set-theme="" data-act-class="ACTIVECLASS">Reset</button>
        <button class="btn" data-set-theme="dark" data-act-class="ACTIVECLASS">Dark</button>
        <button class="btn" data-set-theme="light" data-act-class="ACTIVECLASS">Light</button>
        <Comm />
      </div>
    </>
  );
};

const rxNostr = createRxNostr();
const relays = ["wss://nos.lol", "wss://relay-jp.nostr.wirednet.jp", "wss://nostr.holybea.com", "wss://nostr-relay.nokotaro.com"].map(url => { return { url, write: true } });
rxNostr.setDefaultRelays([{
  url: "wss://yabu.me",
  read: true,
  write: true
}, ...relays]);

const rxReq0 = createRxBackwardReq();

rxNostr.use(rxReq0).pipe(reduce((list, packet) => {
  list.push(packet.message[2]);
  return list;
}, [])).subscribe(list => {
  setComments([...comments, ...list]);
});

rxReq0.emit({ kinds: [1], limit: 100 });
rxReq0.over();

const rxReq = createRxForwardReq();

rxNostr.use(rxReq).subscribe((packet) => {
  setComments([packet.message[2], ...comments]);
});

rxReq.emit({ kinds: [1], limit: 0 });

export default App

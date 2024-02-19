import './App.css'

import { createEffect, createSignal, createMemo, For, onCleanup, onMount } from "solid-js";
import { createStore } from "solid-js/store";

import { createRxNostr, createRxForwardReq, createRxBackwardReq } from "rx-nostr";
import { reduce } from 'rxjs';
import { themeChange } from 'theme-change'

import sanitizeHtml from 'sanitize-html'

const eventCache = new Map();

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
  const locationHandler = window.addEventListener("hashchange", () => setLocation(window.location.hash));
  onCleanup(() => window.removeEventListener("hashchange", locationHandler));
  return location;
}

const location = createRouteHandler();

const Commdom = (props) => {
  const s = createMemo(() => {
    const comment=eventCache.get(props.comment);
    let str = sanitizeHtml(comment.content.trim());
    const urlR = /https:?\/\/[0-9.\-A-Za-z]+\/\S*/g;
    const urls = str.match(urlR);
    const tagR = /#\S+/g;
    const tags = str.match(tagR);
    const replaced = [];
    for (const t of comment.tags) {
      if (t[0] === "r" && (t[1].startsWith("http://") || t[1].startsWith("https://"))) {
        const s = sanitizeHtml(t[1]);
        if (!replaced.includes(s)) {
        replaced.push(s);
        str = str.replaceAll(s, `<a href=${t[1]}>${s}</a>`);
        }
      }
      if (t[0] === "emoji" && (t[2].startsWith("http://") || t[2].startsWith("https://"))) {
        replaced.push(t[2]);
        str = str.replaceAll(`:${t[1]}:`, `<img src=${t[2]} class="m-0 p-0 border-none max-h-6" />`);
      }
      if (t[0] === "t") {
        const s="#" + sanitizeHtml(t[1]);
        if(!replaced.includes(s)){
        replaced.push(s);
        str = str.replaceAll(s, `<a href=${s}>${s}</a>`);
        }
      }
    }
    if (Array.isArray(urls)) {
      for (const url of urls) {
        if (replaced.every(t => (!url.startsWith(t)))) {
          str = str.replaceAll(url, `<a href=${url}>${url}</a>`);
        }
      }
    }
    if (Array.isArray(tags)) {
      for (const tag of tags) {
        if (replaced.every(t => (!tag.startsWith(t)))) {
          str = str.replaceAll(tag, `<a href=${tag}>${tag}</a>`);
        }
      }
    }
    return str;
  });
  /* eslint-disable-next-line solid/no-innerhtml*/
  return (<div innerHTML={s()} />);
};

const Comm = (_props) => {
  const list=createMemo(()=>{
    const loc = decodeURIComponent(location());
    if(loc==="")return comments;
    return comments.filter(comment => { return (((eventCache.get(comment).content.includes(loc)))) })
  });
  return (
    <For each={list()}>
      {(comment, _i) => {
        return (
          <div class="chat chat-start md:text-lg">
            <div class="font-body chat-bubble whitespace-pre-wrap break-all">
              <Commdom comment={comment} />
            </div>
            <div class="chat-footer">
              <button
                class="btn btn-sm"
                onClick={() => {
                  const c=eventCache.get(comment);
                  rxNostr.send({
                    kind: 7,
                    content: "🤙",
                    tags: [["e", c.id], ["p", c.pubkey]]
                  });
                }
                }
              >
                &#x1f919;
              </button>
              {new Date(eventCache.get(comment).created_at * 1000).toLocaleTimeString('en-UK')}
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
    let str = newTitle();

    let ts = [];
    const urlR = /https:?\/\/[0-9.\-A-Za-z]+\/\S*/g;
    const urls = str.match(urlR);
    const tagR = /#\S+/g;
    const tags = str.match(tagR);
    if (Array.isArray(urls)) {
      const list = urls.map(url=>{return ["r",url]});
      ts=[...ts,...list];
    }
    if (Array.isArray(tags)) {
      const list = tags.map(tag=>{return ["t",tag.substring(1)]});
      ts=[...ts,...list];
    }
    if (loc!=="") {
      ts.push(["t",loc.substring(1)]);
      str=str+" "+loc;
    }
    rxNostr.send({
      kind: 1,
      content: str,
      tags:ts
    });
    setTitle("");
  };

  onMount(() => {
    themeChange(false)
  })

  return (
    <>
      <div class="drawer">
        <input id="my-drawer" type="checkbox" class="drawer-toggle" />
        <div class="fixed z-10 navbar bg-base-100 grid grid-cols1">
          <div class="flex">
            <div class="flex-none">
              <label for="my-drawer" class="btn btn-square btn-ghost drawer-button">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" class="inline-block w-5 h-5 stroke-current"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
              </label>
            </div>
            <div class="flex-1">Simple Comments Example</div>
          </div>
          <div >
            <form onSubmit={addComment} class="flex">
              <input
                placeholder="enter a comment"
                required
                value={newTitle()}
                class="input input-bordered grow"
                onInput={(e) => setTitle(e.currentTarget.value)}
              />
              <button class="btn flex-none">+</button>
            </form>
          </div>
        </div>

        <div class="drawer-content">
          <br /><br /><br /><br /><br />
          <Comm />
        </div>

        <div class="drawer-side z-20">
          <label for="my-drawer" aria-label="close sidebar" class="drawer-overlay" />

          <div class="menu p-4 w-80 min-h-full bg-base-200">
            <button class="btn" data-set-theme="" data-act-class="ACTIVECLASS">Reset</button>
            <button class="btn" data-set-theme="dark" data-act-class="ACTIVECLASS">Dark</button>
            <button class="btn" data-set-theme="light" data-act-class="ACTIVECLASS">Light</button>

          </div>
        </div>
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

const processEvent = event=>{
  eventCache.set(event.id,event);
  return event.id;
};

rxNostr.use(rxReq0).pipe(reduce((list, packet) => {
  list.push(processEvent(packet.message[2]));
  return list;
}, [])).subscribe(list => {
  setComments([...comments, ...list]);
});

rxReq0.emit({ kinds: [1], limit: 100 });
rxReq0.over();

const rxReq = createRxForwardReq();

rxNostr.use(rxReq).subscribe((packet) => {
  setComments([processEvent(packet.message[2]), ...comments]);
});

rxReq.emit({ kinds: [1], limit: 0 });

export default App

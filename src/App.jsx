import './App.css'

import { createEffect, createSignal, For } from "solid-js";
import { createStore} from "solid-js/store";

import { createRxNostr, createRxForwardReq, createRxBackwardReq } from "rx-nostr";
import { reduce } from 'rxjs';
import { themeChange } from 'theme-change'


function createLocalStore(initState){
  const [state, setState] = createStore(initState);
  if (localStorage.comments) setState(JSON.parse(localStorage.comments));
  //createEffect(() => (localStorage.comments = JSON.stringify(state)));
  return [state, setState];
}

const [newTitle, setTitle] = createSignal("");

const [comments, setComments] = createLocalStore([]);

const App = () => {

  const addComment = (e) => {
    e.preventDefault();
    rxNostr.send({
      kind: 1,
      content: newTitle(),
    });
    setTitle("");
  };

  createEffect(() => {
    themeChange(false)
  })

  return (
    <>
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
      <For each={comments}>
        {(comment, _i) => (
          <div
            class="chat chat-start md:text-lg"
          >
            <div class="chat-bubble whitespace-pre-wrap break-all">
              {comment.content}
            </div>
            <div class="chat-footer">
            <button
              class="btn btn-sm"
              onClick={() => {
                rxNostr.send({
                  kind: 7,
                  content: "🤙",
                  tags:[["e",comment.id],["p",comment.pubkey]]
                });
              }
              }
            >
              &#x1f919;
            </button>
            {new Date(comment.created_at*1000).toLocaleTimeString('en-UK')}
            </div>
          </div>
        )}
      </For>
    </>
  );
};

const rxNostr = createRxNostr();
rxNostr.setDefaultRelays(["wss://yabu.me"]);

const rxReq0 = createRxBackwardReq();

rxNostr.use(rxReq0).pipe(reduce((list, packet) => {
  list.push(packet.message[2]);
  return list;
}, [])).subscribe(list=>{
  setComments([...comments,...list]);
});

rxReq0.emit({ kinds: [1] , limit:100});
rxReq0.over();

const rxReq = createRxForwardReq();

rxNostr.use(rxReq).subscribe((packet) => {
  setComments([packet.message[2],...comments]);
});

rxReq.emit({ kinds: [1] , limit:0});

export default App

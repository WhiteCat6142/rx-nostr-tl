import './App.css'

import { createEffect, createSignal, For } from "solid-js";
import { createStore} from "solid-js/store";

import { createRxNostr, createRxForwardReq } from "rx-nostr";
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
        {(comment, i) => (
          <div
            class="text-lg"
          >
            {comment.content}
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
          </div>
        )}
      </For>
    </>
  );
};

const rxNostr = createRxNostr();
rxNostr.setDefaultRelays(["wss://yabu.me"]);

const rxReq = createRxForwardReq();

rxNostr.use(rxReq).subscribe((packet) => {
  setComments([packet.message[2],...comments]);
});

rxReq.emit({ kinds: [1] , limit:100});

export default App

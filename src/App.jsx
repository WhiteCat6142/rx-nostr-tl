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
    setComments(comments.length, {
      title: newTitle()
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
        {(todo, i) => (
          <div
            class="text-lg"
          >
            {todo.title}
            <button
              class="btn btn-sm"
              onClick={() => setComments([...comments.slice(0, i()), ...comments.slice(i() + 1)])}
            >
              x
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
  setComments([{title:JSON.stringify(packet.message[2].content)},...comments]);
});

rxReq.emit({ kinds: [1] });

export default App

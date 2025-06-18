import { useState, useEffect } from "react";
import "./App.css";
import blockdata from "./assets/data.json";

const url = "https://blockstream.info/liquid";

function Block({ block }) {
  let extra = {
    false: { cls: "inactive", icon: "." },
    true: { cls: "active", icon: "✓" },
  };
  const title = `Block height: ${block.height} - version 0x${block.versionhex}`;
  const active = block.simplicity;
  return (
    <a
      href={`${url}/block/${block.hash}`}
      target="_blank"
      title={title}
      className={"block " + extra[active].cls}
    >
      <p className="height">{block.height}</p>
      {/* <p className="version">0x{block.versionhex}</p> */}
    </a>
  );
}

function Blocks({ blocks }) {
  return blocks.map((block) => <Block key={block.hash} block={block}></Block>);
}

function Card({ title, value, info }) {
  return (
    <div className="card">
      <p className="card-title" title={info}>
        {title}
      </p>
      <p className="card-value">{value}</p>
    </div>
  );
}

function processBlocks(blocks) {
  let processed = {};

  for (const block of blocks) {
    const versionhex = block.version.toString(16);
    processed[block.height] = {
      hash: block.id,
      height: block.height,
      version: block.version,
      versionhex,
      simplicity: versionhex === "20200000",
    };
  }

  return processed;
}

async function fetchBlocks(start) {
  console.log("fetchblocks", start);
  const response = await fetch(
    `https://blockstream.info/liquid/api/blocks/${start}`
  );

  const blocks = await response.json();
  return processBlocks(blocks);
}

function getTip(blocks) {
  const keys = Object.keys(blocks);
  const height = keys[keys.length - 1];
  const hash = blocks[height].hash;
  return { height, hash };
}

async function checkHeight(blocks, setBlocks) {
  const { height } = getTip(blocks);
  console.log("check for newer tip than", height);
  const response = await fetch(
    "https://blockstream.info/liquid/api/blocks/tip/height"
  );
  const newTip = await response.json();
  const behind = newTip - height;
  if (behind > 0) {
    console.log("behind", behind);
    let newBlocks = {};
    for (let start = newTip; start > height; start -= 10) {
      newBlocks = { ...newBlocks, ...(await fetchBlocks(start)) };
    }
    setBlocks({ ...blocks, ...newBlocks });
  } else {
    console.log("tip is current");
  }
}

function App() {
  const [blocks, setBlocks] = useState(blockdata.blocks);
  const showBlocks = Object.values(blocks).reverse().slice(0, 300);
  const { height, hash } = getTip(blocks);

  const { deployments } = blockdata.deployments;
  const { simplicity } = deployments;
  const { bip9 } = simplicity;
  const stats = bip9.statistics;

  // init
  useEffect(() => {
    console.log("init check height");
    checkHeight(blocks, setBlocks);
  }, []);

  // interval
  useEffect(() => {
    const interval = setInterval(() => {
      console.log("interval check height");
      checkHeight(blocks, setBlocks);
    }, 60000);
    return () => clearInterval(interval);
  }, [blocks]);

  return (
    <div>
      <h1>Simplicity</h1>
      <p>
        <a href="https://blockstream.com/simplicity.pdf" target="_blank">
          Simplicity
        </a>{" "}
        is a typed, combinator-based, functional language without loops or
        recursion. It is formally specified, and can be statically analyzed with
        upper bounds on computation resources prior to execution. Simplicity has
        the desirable property of being Turing incomplete, but can express any
        finitary function.{" "}
        <strong>
          Simplicity is the next generation in smart contract scripting.
        </strong>
      </p>
      <h2>BIP-9 signalling on The Liquid Network</h2>
      <p>
        Chain height:{" "}
        <a href={`${url}/block/${hash}`} target="_blank">
          {height}
        </a>
      </p>
      <p>Simplicity BIP-9 deployment</p>
      <Card
        title="Active"
        value={simplicity.active.toString()}
        info="Is Simplicity active yet?"
      ></Card>
      <Card
        title="Status"
        value={bip9.status}
        info="The BIP-9 status of the Simplicity deployment"
      ></Card>
      <Card
        title="Period"
        value={stats.period}
        info="The number of blocks of each signalling period"
      ></Card>
      <Card
        title="Since"
        value={bip9.since}
        info="The block height at which this period started"
      ></Card>
      <Card
        title="Elapsed"
        value={stats.elapsed}
        info="How many blocks have elapsed in this period"
      ></Card>
      <Card
        title="Count"
        value={stats.count}
        info="How many blocks have signalled in this period"
      ></Card>
      <Card
        title="Threshold"
        value={stats.threshold}
        info="How many blocks are required to signal in the period"
      ></Card>
      <Card
        title="Possible"
        value={stats.possible.toString()}
        info="Is it still possible to activate in this period?"
      ></Card>

      <p>Last {showBlocks.length} blocks</p>
      <Blocks blocks={showBlocks}></Blocks>
      <footer>
        <p>
          <a
            href="https://github.com/delta1/simplicity-tracker"
            target="_blank"
          >
            source code
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;

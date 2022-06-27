// delay function
export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// random delay function
export async function randomSleep(min: number, max: number) {
  const delay = Math.random() * (max - min) + min;
  console.log(`sleeping... (${(delay / 1000).toFixed(2)}s)`);
  await sleep(delay);
}

#!/usr/bin/env node
/**
 * Script to find transactions in NEAR localnet
 * Searches blocks and chunks to find transaction data
 */

const RPC_URL = process.env.RPC_URL || 'http://54.90.246.254:3030';

async function findTransactions() {
  console.log(`Connecting to RPC: ${RPC_URL}\n`);

  try {
    // Get network status
    const statusRes = await fetch(RPC_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'status',
        params: []
      })
    });
    const status = await statusRes.json();
    
    if (status.error) {
      console.error('RPC Error:', status.error);
      return;
    }

    const latestHeight = status.result.sync_info.latest_block_height;
    console.log('Latest Block Height:', latestHeight);
    console.log('Chain ID:', status.result.chain_id);
    console.log('Syncing:', status.result.sync_info.syncing);
    console.log('');

    // Search strategy: Check recent blocks first, then expand search
    const searchRanges = [
      { name: 'Last 100 blocks', count: 100 },
      { name: 'Blocks 100-500 ago', count: 400, offset: 100 },
      { name: 'Blocks 500-2000 ago', count: 1500, offset: 500 },
    ];

    const allTransactions = [];
    let totalBlocksChecked = 0;

    for (const range of searchRanges) {
      console.log(`\n=== ${range.name} ===`);
      const startHeight = Math.max(0, latestHeight - (range.offset || 0) - range.count);
      const endHeight = latestHeight - (range.offset || 0);

      for (let height = endHeight; height >= startHeight; height--) {
        try {
          const blockRes = await fetch(RPC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              jsonrpc: '2.0',
              id: height + 1,
              method: 'block',
              params: { block_id: height }
            })
          });
          const blockData = await blockRes.json();

          if (blockData.error) {
            console.error(`Error fetching block ${height}:`, blockData.error.message);
            continue;
          }

          if (blockData.result && blockData.result.chunks) {
            for (const chunk of blockData.result.chunks) {
              try {
                const chunkRes = await fetch(RPC_URL, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: Date.now(),
                    method: 'chunk',
                    params: [chunk.chunk_hash]
                  })
                });
                const chunkData = await chunkRes.json();

                if (chunkData.result && chunkData.result.transactions) {
                  for (const tx of chunkData.result.transactions) {
                    allTransactions.push({
                      hash: tx.hash,
                      signer: tx.signer_id,
                      receiver: tx.receiver_id,
                      block_height: height,
                      actions: tx.actions ? tx.actions.length : 0,
                      actions_detail: tx.actions || []
                    });
                  }
                }
              } catch (err) {
                // Skip chunk errors silently
              }
            }
          }

          totalBlocksChecked++;
          if (totalBlocksChecked % 50 === 0) {
            process.stdout.write(`\rChecked ${totalBlocksChecked} blocks, found ${allTransactions.length} transactions...`);
          }

          // Stop if we found enough transactions
          if (allTransactions.length >= 50) {
            console.log(`\nFound ${allTransactions.length} transactions, stopping search...`);
            break;
          }
        } catch (err) {
          // Skip block errors
        }
      }

      if (allTransactions.length > 0) {
        console.log(`\nFound ${allTransactions.length} transactions in this range!`);
        break;
      }
    }

    console.log('\n\n=== RESULTS ===');
    console.log(`Total blocks checked: ${totalBlocksChecked}`);
    console.log(`Total transactions found: ${allTransactions.length}\n`);

    if (allTransactions.length > 0) {
      console.log('Transactions found:');
      allTransactions.forEach((tx, i) => {
        console.log(`\n${i + 1}. Transaction Hash: ${tx.hash}`);
        console.log(`   Block Height: ${tx.block_height}`);
        console.log(`   Signer: ${tx.signer}`);
        console.log(`   Receiver: ${tx.receiver}`);
        console.log(`   Actions: ${tx.actions}`);
        if (tx.actions_detail.length > 0) {
          console.log(`   Action Types: ${tx.actions_detail.map(a => Object.keys(a)[0]).join(', ')}`);
        }
      });

      const minBlock = Math.min(...allTransactions.map(tx => tx.block_height));
      const maxBlock = Math.max(...allTransactions.map(tx => tx.block_height));
      console.log(`\nTransaction block range: ${minBlock} to ${maxBlock}`);
      console.log(`Distance from latest: ${latestHeight - maxBlock} blocks ago`);
    } else {
      console.log('No transactions found in the searched blocks.');
      console.log('\nPossible reasons:');
      console.log('1. Transactions may not have been included in blocks yet');
      console.log('2. Transactions might be in older blocks (>2000 blocks ago)');
      console.log('3. The localnet may not have transaction activity');
      console.log('4. Transactions might have failed and not been included');
      console.log('\nSuggestions:');
      console.log('- Check if transactions were successfully sent');
      console.log('- Verify the RPC endpoint is correct');
      console.log('- Check transaction status using EXPERIMENTAL_tx_status');
    }
  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
  }
}

// Run the script
findTransactions();


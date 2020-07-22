# Rate Control through Adaptive Proof of Work [spec]

This specification is part of [Coordicide](https://coordicide.iota.org/).

## Summary
In Proof of Work-based blockchains, a built-in rate limit is enforced by the mining difficulty adjustment and the message fees. In IOTA, however, an attacker may be able to easily issue a very large number of messages to create double spends or denial of service attacks. Hence, an *explicit rate control mechanism becomes necessary*. In order to ensure that the network traffic does not exceed the allowed throughput determined by the limited resources, it is fundamental to limit the number of messages issued at node level.

### Current implementation

In the current IOTA implementation, a user is asked to solve a Proof of Work (PoW) before issuing a new message. The user can either perform that computation locally or outsource it to a third-party service.

In the main network, the difficulty of the PoW is set to 14 (the computation difficulty is tripled for every unit increase). Received messages are stored in a queue and processed in FIFO order. The protocol dictates that the nodes only forward messages if and only if the difficulty of the PoW performed is greater or equal to 14. Otherwise, messages will be dropped.

However, due to the parallelizable nature of PoW, we know that FPGAs or ASICs can solve the PoW several orders of magnitude faster than general purpose hardware. The advantage of this specialized hardware is clearly problematic.

### Proposal

Similar to the current implementation, we require the solution of a given cryptographic puzzle before a message is issued. Here, however, we impose that the difficulty of the challenge progressively increases as a node decides to issue multiple messages in a short time interval.

The goal of this document is to define this rate control mechanism, called *Adaptive PoW*, which permits theoretical nodes' throughput to be independent on their hardware performance. In practice, the actual throughput will only depend on nodes' reputation. We believe that this mechanism is fundamental to discourage spam attacks. In fact, while our congestion control layer will provide enough protection against Sybil attacks and selfish behavior (see [here](https://hackmd.io/@MdtzMI7yTYmOxpysMspUuA/SyHpc6O6I)), nothing would prevent a dishonest node from inflating its neighbors' buffers by issuing a large number of messages in short time. More importantly, this may eventually lead to inconsistencies in the messages seen by different nodes, causing overhead and slowing the entire network down.

### Prerequisites

*Node identity*. We require node accountability where each message must be associated with the global identifier of its issuing node.

*Timestamp*. Timestamps must be valid.

Every node has a clock, and a cache which stores the most recent messages.

Mana is *not* required. The Sybil protection is left to the scheduler (see [congestion control specs](https://hackmd.io/@MdtzMI7yTYmOxpysMspUuA/SyHpc6O6I)).

## Adaptive Proof of Work

All nodes in the network have knowledge of the following three fixed global parameters:

* *Base difficulty $d_0$*. It sets the minimum difficulty of PoW.
* *Adaptation rate $\gamma\in [0, 1]$*. It provides the rate at which difficulty will be adjusted. 
* *Time window $w>0$*. It describes the width of the time interval considered by the algorithm, i.e., its granularity.

### Message generation

At time *t* (according to its local clock), node *m* must perform PoW with difficulty

\begin{equation}
d_m(t) = d_0 + \left \lfloor{\gamma\cdot r_m(t)}\right \rfloor,
\end{equation}
    
where $r_m(t)$ represents the number of messages issued by node $m$ in the time interval $[t-w, t]$. The time considered is the one provided by the timestamp inside the message. Note that when $\gamma=0$, the algorithm becomes equivalent to the current IOTA implementation.

### Message verification

When a node $n$ receives a message from a neighbor, it must check that PoW with an appropriate difficulty was performed. Let us assume that node $n$ receives a message with difficulty $d_m$ issued by node $m$. To decide whether this message should be discarded or not, node $n$ counts how many messages $r_m(t)$ issued by $m$ it has received in the last $w$ time units. In accordance to the formula above, the node validates the PoW only if the following condition is satisfied:
\begin{equation}
    d_m \geq d_0 + \left\lfloor{\gamma\cdot r_m(t)}\right\rfloor.
\end{equation}

Discussions on the correctness of this procedure can be found on a [related article](https://iota.cafe/t/adaptive-pow-without-sequence-numbers/363).

## Algorithm

### Protocol variables

In line with the previous section, all nodes know the following global variables:

* `int d0`: base difficulty (proposed values [10 - 14])
* `float gamma`: adaptation rate (proposed values [0.1 - 1])
* `int w`: time window (proposed values [10 - 100s])

The choice of the time window is crucial in the correct functioning of the algorithm. Our claim is that the time window must be kept small for two main reasons:

* Message burst can be captured.
* Implementation is easier as it requires smaller caches.

However, it is fundamental to keep this time window at least larger than the network delay.

Further research is needed in order to provide more accurate suggestions for default values.

### Node variables

* `long timestamp`: time at which the message has been issued
* `string nodeId`: ID of the node issuing the message
* `int targetDifficulty`: minimum difficulty needed to pass the PoW verification
* `bool powCheck`: boolean value which indicates whether the PoW verification is successful or not
* `long currentTime`: local time at the node
* `string selfId`: ID of the node
* `queue<long> msgCache`: cache storing the most recent messages received by the node. Only the timestamp is stored
* `hashmap<string,queue> nodeMap`: list of recent timestamps divided per nodeId

### Pseudocode

#### `timestamp, nodeId = getMsg(msg)`

The function *getMsg()* includes *Node Signature Validation* and *Timestamp Opinion Set and Filter*, which are discussed in a different document.

```
nodeId = nodeSigValidation(msg)
timestamp = timestampOpinion(msg)

return timestamp, nodeId
```

#### `difficulty = getDifficulty(msg)`

This function checks the difficulty of the PoW attached to the message through *zeroTritsEnd*, which counts the number of ending 0 trits of the hash (*curl* function) of all the message fields in trits.

```
difficulty = zeroTritsEnd(curl(msg))

return difficulty
```

#### `countMsg = countMsgInInterval(timestamp, nodeId, ledger)`

This function accesses the ledger to check the history of messages for nodeId. The function *getId()* does not require signature verification and timestamp validity, as these messages are already part of the ledger (hence, they have already been checked).

```
// cache update
msgCache.dequeue()
msgCache.enqueue(timestamp)

// msg count
countMsg = 0
msg = nodeMap[nodeId]
while msg NOT NULL:
    if msg* > timestamp - w AND msg* < timestamp:
        countMsg++
    msg.next()
nodeMap[nodeId].enqueue(msgCache.tail())
        
return countMsg
```

#### `targetDifficulty = getTargetDifficulty(timestamp, nodeId)`

This function applies the formula described in the previous section to determine the minimum difficulty required.

```
countMsg = countMsgInInterval(timestamp, nodeId)
targetDifficulty = d0 + floor(gamma * countMsg)

return targetDifficulty
```

#### `main_generation(msg)`

This procedure generates a new message. The routine *attachPoW* solves a PoW with difficulty *targetDifficulty* and includes the related nonce in the message.

```
// upon creation of a new message msg
targetDifficulty = getTargetDifficulty(currentTime, selfId)
attachPoW(msg, targetDifficulty)
```

#### `powCheck = main_verification(msg)`

This function is triggered once a node receives a new message. It returns `TRUE` if the PoW attached to the message is sufficient, or `FALSE` otherwise.

```
// upon arrival of msg
timestamp, nodeId, difficulty = getMsg(msg)
targetDifficulty = getTargetDifficulty(timestamp, nodeId)

if difficulty >= targetDifficulty:
    return TRUE
else:
    return FALSE
```

### Data structures

The most critical part of the algorithm concerns counting the number of messages recently issued by a node. Since querying the database may be expensive, we propose to cache the most recent messages. To this end, we use two data structures:

* *nodeMap*. Each entry in the hashmap corresponds to a different nodeId and points to the doubly linked list of recent messages of the same node.
* *msgCache*. A queue which removes old messages and add new ones according to a FIFO policy.

![](https://i.imgur.com/vgbhyJO.png)

Both data structures point to the same locations of memory which store the timestamp of the message. These locations of memory also store the pointers to the other elements of *nodeMap* and *msgCache*.

The size of the cache $C$ (in number of timestamps) must be larger of the product between the maximum network throughput and the time window $w$. Assume that max throughput is 1000 TPS and the time window is 50 s, cache size must be larger than 50,000. Given $N$ the number of nodes issuing recent messages, our caching scheme provides the following performance:

* cache update: $\mathcal{O}(1)$
* msg counter: $\mathcal{O}(C/N)$
* cache size: 1-5 MB

## Attack vectors

### False positive messages

Assume that a node receives a message with PoW difficulty equal to *targetDifficulty*. However, the node cannot know (immediately) whether older messages have been issued before the timestamp of such message, which would make its PoW not sufficient. In this case, in order not to slow down the network, the node will forward anyway the message for scheduling.

An attacker may exploit the above in order to issue progressively older messages which would be accepted with easier PoW difficulty. Since the timestamp validation window is pretty large (~30 minutes), this attack may theoretically be effective.

We make the following counter-actions to limit the effectiveness of such an attack:

* In case a node receives a new message with a timestamp that would make not valid other messages from the same *nodeId*, then the node will delete the latter.
* Scheduler algorithm (described in the congestion control spec) takes care of assigning a fair share of traffic to each *nodeId*.

### Pre mining

An attacker may decide to pre mine a long chain of messages and issue them in short time. To overcome this problem, we propose to include a random number (from the distributed random number generator) in the computation of the PoW.

## Alternative solutions

Verifiable delay functions.
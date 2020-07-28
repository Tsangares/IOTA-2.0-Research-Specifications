This note details the management of the message tangle.
Started 2 June 2020.


# Summary

Data will be gossiped through the network in objects called messages. These messages will be stored in a data structure called the  message tangle.   This specification details how this information is stored and managed.  

The exact layout of messages is given in a [different specification](add-link).  Moreover, how messages are gossiped is the subject of the [rate control specification](add-link).  

In this specification, we discuss the following topics.
1. Timestamps
2. Below Max Depth Rule
3. Tip selection
4. Finality
5. Snapshotting
6. Reattachments

Each of these topics will be given a "mini-specification" which details the design along with the rationale and any open questions or alternatives.




# Preliminaries


## Parameters, lists, and functions
The following are the applicable parameters.  
* `D` gGratuitous network delay~5 minutes.  We assume all messages are delivered within this time.
* `w` window~30 minutes. Require `w>2D`
* `Delta` max difference in consecutive timestamps. Require `Delta>w+D`
* `theta` confidence level of grade 2 finality for messages.  
* `T` time for grade 3 finality for messages
* `snapshotTime` Age of a transaction when snapshotted. Require `snapshotTime>Delta+w+2D`  


The following are the applicable lists.
* `messageTangle` The database of messages.
*  `eligibleTipsList` The messages eligible for the selection algorithm.  
* `pending` The messages not eligible for tip selection.  

In implementations, the second two lists could simply be flags on messages in `messageTangle`.   

We use the following variable
* `currentTime` which gives the current time of the node.  



We define the following function.
* `getTip` Function which employs the tip selection algorithm.
* `confirmationConfidence` Measures the number of approvers.


## How messages are stored

Every message in `messageTangle` will be identified through its `MessageID`.  Amongst other things, each message contains the following information:
* `parent1` and `parent2` These are message IDs of two other messages and endow the message tangle with a DAG structure.  Together these fields shall be called *parents*.
* `timeStamp` This is a time.  This field will be discussed in SubsSection 1. 

Messages of course have other information, but they are not relevant for this specification.  See [BLANK](https://) for a full account on the layouts of messages.

Messages will be stored with the following fields:
* `arrivalTime` The local time that the message first arrived to the node.  
* `opinionField` Contains the nodes' opinion on the timestamp of a message.  As specified [here](https://hackmd.io/xBfQ04NkRi6IrwhEQm7aJQ), this field is a triple `(opinion,level,timeFormed)`, where `opinion` is a Boolean value, `level` is in the set {1,2,3}, and `timeFormed` is a time. The `opinionField` is also manipulated by FPC.
* `eligible` is a Boolean value, denoting if the message was ever eligible for tip selection. 

# Main Components

## 1. Timestamps
 

Every message contains the field `timeStamp` which is signed.  The timestamp should be the time when the message was created, and this will be enforced to some degree through voting.  Specifically, nodes will vote on whether the timestamp was issued within `w` of current local time. This time window is large to account for the network delay. 

### Detailed Design
When a message is being added to the tangle, the following algorithm will be performed:
```
timeFormed <- currentTime
If |arrivalTime-currenTime|<w 
    Then opinion <- TRUE
    Else opinion <- FALSE
If ||arrivalTime-currenTime|-w|<D 
    Then level <- 1
Else If ||arrivalTime-currenTime|-w|<2D
    Then level <- 2
Else level <- 3
```  

### Rationale
Since $D$ estimates the network delay, a node can reasonably estimate the arrival time of messages to other nodes.  A node has level 2 knowledge if the time difference is greater than the network delay. A node has level 3 knowledge if the difference is greater than twice the network delay.  See [this specification](https://hackmd.io/xBfQ04NkRi6IrwhEQm7aJQ) for a deeper discussion on levels of knowledge.  

### Open Questions

The main question is how large to set `w` and `D`.  A small `w` would enable many applications, since the timestamps would be more accurate.  However, they cannot be too small without causing problems with network delays.  


## 2. Below Max Depth Check 

We need the tangle to grow forward: we do not want incoming messages to reference extremely old messages.  If any new message can reference any message in the tangle, then a node will need to keep all messages readily available in memory, precluding snapshotting.  

### Detailed Design

When a message is added to the tangle, the node runs the following *Below Max Depth Check*.

```
If { Delta>messageID.timestamp-messageID.parent1.timeStamp >0} is FALSE
    Then Return INVALID
If { Delta>messageID.timestamp-messageID.parent2.timeStamp >0} is FALSE
    Then Return INVALID
```

If this check returns `INVALID`, the message is considered invalid, deleted, and not gossiped.  

### Rationale

Suppose an incoming message has a parent with timestamp older than w+2D+Delta.  Then the message either has a timestamp which is bad level 3, or else it will fail the below max depth check.  In either case, the message will eventually be deleted. 

## 3. Tip selection

We will use RURTS which stands for Restricted Uniform Random Tip Selection. This means we choose tips randomly from  a list of "good" tips, i.e., the `eligibleTipsList`.  


### Detailed Design


First, we describe how the `eligibleTipsList` is maintained.  After the timestamp is set, when a message is added to the tangle, the following logic is performed:
```
If messageID.opinionField.opinion=TRUE and (messageID.opinionField.level=2 or messageID.opinionField.level=3) 
Then 
    If messageID.parent1.eligible=True and messageID.parent2.eligible=True
        Then 
        messageID.eligible<-True
        Add messageID to eligibleTipsList
        Remove messageID.parent1 from eligibleTipsList
        Remove messageID.parent2 from eligibleTipsList
    EndIf
Else Add MessageID to pending
Endif
```

Periodically we check the `pending` list for new messages which are eligible.  
```
For every messageID in pending
    If messageID.opinionField.opinion=TRUE and (MessageID.opinionField.level=2 or messageID.opinionField.level=3) 
    Then 
        If MessageID.parent1.eligible=True and MessageID.parent2.eligible=True
            Then 
            Remove MessageID from pending
            MessageID.eligible<-True
            Add MessageID to eligibleTipsList
            Remove MessageID.parent1 from eligibleTipsList
            Remove MessageID.parent2 from eligibleTipsList
        EndIf
    EndIf
EndFor
```


We now define the following function `getTip`.
```
Function: getTip
Inputs: none
Outputs: messageID

Randomly select messageID from eligibleTipsList
While (currentTime-messageId.timeStamp<Delta) is FALSE
    Randomly select messageID from eligibleTipsList
EndWhile
Return messageID
```


### Rationale

RURTS is easy to implement, computationally inexpensive, and minimiszes orphanage. Moreover, it is in weak Nash equilibrium: honest users have nothing to gain by deviating from the protocol. Additionally, this tip selection algorithm should be resistant to blow ball attacks.  

As demonstrated in the original Iota white paper and subsequent simulations, URTS has no orphans.  Theoretically, RURTS should largely approximate URTS.  The only difference is that some tips may "expire" when they become older than `Delta`.  With a large `Delta`, honest messages will essentially never be orphaned. 

A message disliked by FPC will not be added to `eligibleTipsList` and thus will be orphaned.  Moreover, a message will be orphaned if some message in its past cone is disliked by FPC.  In this way, the algorithms enforce monotonicity in FPC voting, without traversing the tangle marking flags.

Since messages with questionable timestamps will not be flagged eligible until FPC resolves their status, honest messages should not approve them.  Thus, an attacker cannot trick honest messages into being orphaned.

It is necessary that `Delta>w+D` in order to prevent the following attack.  Suppose `w=30`, `D=5`, and `Delta=5`.  Given these parameters, an attacker can maintain a chain of messages whose tip always has a timestamp between `currentTime-10` and `currentTime-15`,   because the timestamps in this interval will always be valid. However, the confirmation confidence (the probability of selecting a tip that is an indirect approver) of every message in this chain will always be `0` because each message is older than `Delta`.  At anytime, the attacker can orphan the entire chain by ceasing issueing messages, but the attacker can also  have the chain reach full confirmation confidence by issueing tips with current timestamps. Thus the status of this chain is indeterminable: the messages are neither "in" nor "out" of the ledger.  This is effectively a liveness attack.  

To summarize, bad messages will be orphaned, and honest messages will not.  Moreover, we claim that there is no middle ground: regardless of an attacker's actions, all messages flagged as eligible will not be orphaned, with high probability.   Indeed, `Delta` will be set significantly greater than `w+D`, thus any message added to the eligible tip list will be eligible for tip selection long enough that it will be eventually selected with high probability.  


### Alternatives

Tips in the eligible tip list might expire, although this should not happen very often given the discussion above. Such tips will be removed from `eligibleTipList` during snapshotting.  However, to optimize efficiency, a node may want to occasionally clean the `eligibleTipList` of expired tips.

Similarly, the `pending` list can be regularly cleaned of messages which will never become eligible.  Indeed, if any message directly references a message with `opinion=FaLSE`  or `level` 2 or 3, that message can be eliminated from the pending list.  However, if they are not, they will be scrubbed from the pending list during the snapshot.  

Periodically cycling through the pending list may not be efficient.  Instead, a node can check the `pending` list when it performs an action which might cause a message to become eligible.  For example, if FPC changes the opinion of a message to `True`  with `level=3`, the node can immediately remove the message, can flag it as eligible and move it to the `eligibleTipList`.  Similarly, whenever a message is flagged eligible, a node can search `pending` for messages which reference it, and then check if these messages can now be flagged as eligible.  
 
### Open questions

In the previous section, we make some fairly bold claims, but these still need to be analyzed thoroughly. Rough calculations and intuition support our claims, but rigorous analysis is needed. Specifically, we need to understand:
* The probability of being orphaned as a function of `Delta`.
* The attack strategies for preventing good transactions from being approved.
* The effects of malicious structures such as blowballs forming in the tangle. 
We know for instance the probability of being orphaned is "small", but we do not know how small: is it say $10^{-4}$ or $10^{-12}$?  


## 4. Finality

Users need to know when their information has been successfully added to the tangle.  In other words, they need to know when their information will not be orphaned.  However, finality is inherently probabilistic.  For instance, consider the following scenario. An attacker can trivially maintain a chain of messages that do not approve any other message.  At any given point in time, it is possible that all messages will be orphaned except this chain.  This is incredibly unlikely, but yet still possible.  

We introduce several grades of finality.  The higher grade the finality, the less likely it is to be orphaned.  

We do not specify any algorithms for computing which messages have these degrees of finality: this is the prerogative of the node software. 

### Detailed Design

There are three grades of finality for a message.
* Grade 1: The message and every message in its history satisfy the following: the opinion is `TRUE` and the level is either 2 or 3.  In other words, the message has the `eligible` flag set to `True`.
* Grade 2: The message has Grade 1 finality, and the confidence level is greater than `theta` for some parameter.
* Grade 3: The message has Grade 2 finality and the timestamp is older than `T`.

To make these definitions precise, we define the following function:
```
Define: confirmationConfidence
Inputs: messageID
Outputs: number between 0 and 1

Return Probability that getTip indirectly references messageID
```

Grade 2 finality is dependent on the parameter `theta` and, Grade 3 is dependent on both `theta` and `T`.  Thus, these grades exist on a continuum.

### Rationale

A message is "final" if we are sure that it won't be orphaned. Recall that we call a message is orphaned if it is not indirectly referenced by any eligible tips. Unfortunately, finality can never be definitively determined: we can only describe conditions where the probability of orphanage is low. Each of these grades are examples of such conditions. 

To not be orphaned, a message must be eligible for tip selection, hence Grade 1.  Once eligible, it is possible, though unlikely, that it will be orphaned.  This probability decreases quickly as the message gains more approvers.  Hence a message with say 10% confirmation confidence is very unlikely to be orphaned. Thus we have Grade 2.  

There is a small probability that a grade 2 message might be orphahned. This would happen if other nodes did not choose the approving tips before they expired. This is highly unlikely even in the face of an attack.




Moreover, it is exponentially less likely that an old grade 2 message will be orphaned, hence the definition of grade 3.  Let us explain.  Because of the below max depth check, in order for an old message `M` to have grade level 2, `M` must belong to a chain of grade 2 messages whose length is proportional to its age. If  `M` is orphaned, then the whole chain must be orphaned. Thus, the situation described in the previous paragraph would have to repeat several times.

### Open questions

We need to understand the probabilities of orphanage associated with each level of finality.  As discussed earlier, these probabilities should be small, but it would be useful to know how small.  In studying these questions, we may also find that two of these finalities are essentially the same.  

## 5. Snapshotting

Snapshotting may be viewed as merely an optimization. However, since it is critical for nodes, particularly in the IoT setting, we enable it at the protocol level.

 Essentially, a message can be snapshotted when we are sure that all incoming messages directly referencing it will be orphaned. This determination can be made using timestamps. 

### Detailed Design

When `currentTime-messageID.timestamp>snapshotTime`, the node should do the following.
* Remove messageID from `pending` if present
* Remove messageID from `eligibleTipList` if present
* Remove the message from `messageTangle`  

The parameter `snapshotTime` can be set individidually by each node as long as `snapshotTime>w+2D+Delta`.  


### Rationale

Recall that we require that `snapshotTime>w+2D+Delta`.  Suppose a message `M` is snapshotted, and then the node receives a new message `N` which directly references `M`.  Then either:
1. The timestamp is bad level 3
2. The message violates the below max depth rule

In either case, the message `N` will be orphaned by all nodes.  Thus, the node may treat `N` as an unsolid message which can never be solidified, because in this case, `N` will still be orphaned. Moreover, no honest node should be gossiping `N`.

### Alternatives

First, a node can maintain a `snapshotFile` in the following way: when `currentTime-messageID.timestamp>snapshotTime`, the node performs the following.
```
If confirmationconfidence(messageID)>theta  Then
    Add messageID to snapshotFile
    Remove messageID.parent1 from snapshotFile
    Remove messageID.parent2 from snapshotFile
EndIf
```
This file maintains the "tips" of the snapshotted messages and can be communicated to other nodes who are trying to synchronize with the network.  

Second, individual nodes do not necessarily need to delete snapshotted messages, but can simply transfer them to a different area of memory.  For instance, a permanode could move the message into storage.  

## 6. Reattachments

The message tangle is a conflict free replicated data type, which means it contains no conflicts.  Thus a payload of a message can be reattached freely.  This is because the communication layer does not parse the payloads: they are treated just as data.    



















<!--stackedit_data:
eyJkaXNjdXNzaW9ucyI6eyJra0VvZ1ZoeHBPa1pWcldFIjp7In
RleHQiOiJXZSBhc3N1bWUgYWxsIG1lc3NhZ2VzIGFyZSBkZWxp
dmVyZWQgd2l0aGluIHRoaXMgdGltZS4iLCJzdGFydCI6OTUwLC
JlbmQiOjEwMDR9LCJNUk1qZXJqaHk0YllHRWtvIjp7InRleHQi
OiJwZW5kaW5nYCBUaGUgbWVzc2FnZXMgbm90IGVsaWdpYmxlIG
ZvciB0aXAgc2VsZWN0aW9uLiIsInN0YXJ0IjoxNDgxLCJlbmQi
OjE1MzR9LCJYSFd0bXE5bjBsY1VQSHluIjp7InRleHQiOiJNZX
NzYWdlSUQiLCJzdGFydCI6MTk4MywiZW5kIjoxOTkyfSwibFdN
RGFpNFdsQzlHdnBlcSI6eyJ0ZXh0IjoidGltZSBmb3IgZ3JhZG
UgMyBmaW5hbGl0eSBmb3IgbWVzc2FnZXMiLCJzdGFydCI6MTE4
NiwiZW5kIjoxMjI0fSwiSHFkV1dEVFBreE8yb3R1WiI6eyJ0ZX
h0IjoiY29uZmlkZW5jZSBsZXZlbCBvZiBncmFkZSAyIGZpbmFs
aXR5IGZvciBtZXNzYWdlcy4iLCJzdGFydCI6MTEyNywiZW5kIj
oxMTc3fSwiaE5DS1REZGUzOGF1NVl1dSI6eyJ0ZXh0IjoidGlt
ZSIsInN0YXJ0IjoyMjYyLCJlbmQiOjIyNjZ9LCJZWk9nN3pjMX
JiT0dmbGRaIjp7InRleHQiOiJ3aWxsIGJlIHN0b3JlZCIsInN0
YXJ0IjoyNDkxLCJlbmQiOjI1MDV9LCI4Wm1DRXNpaHpYSkZNOT
EyIjp7InRleHQiOiJpcyIsInN0YXJ0IjoyOTU4LCJlbmQiOjI5
NjB9LCJPcVlkcllzeWFyYkhvWUVnIjp7InRleHQiOiJjdXJyZW
50IHRpbWUiLCJzdGFydCI6MzM0NCwiZW5kIjozMzYyfSwiTFJz
dUxwS2NvMjBUbFRlMyI6eyJ0ZXh0IjoiVGhpcyB0aW1lIHdpbm
RvdyIsInN0YXJ0IjozMzY0LCJlbmQiOjMzODB9LCJmUmdzRlpu
clRjZmUyNGIzIjp7InRleHQiOiJXaGVuIGEgbWVzc2FnZSIsIn
N0YXJ0IjozNDQ2LCJlbmQiOjM0NjB9LCJKNmlySHJFdVVsUmlN
UjBlIjp7InRleHQiOiJXaGVuIGEgbWVzc2FnZSBpcyBhZGRlZC
B0byB0aGUgdGFuZ2xlLCB0aGUgbm9kZSBydW5zIiwic3RhcnQi
OjQ3NzIsImVuZCI6NDgyNH0sImpTd2ZPY21aM0J1YWpyb1MiOn
sidGV4dCI6ImN1cnJlbnRUaW1lLW1lc3NhZ2VJZC50aW1lU3Rh
bXA8RGVsdGEiLCJzdGFydCI6NzAyNywiZW5kIjo3MDY0fSwibW
VDRUlwWjV4TE1LdWNnTSI6eyJ0ZXh0IjoiY29uZmlybWF0aW9u
IGNvbmZpZGVuY2UiLCJzdGFydCI6ODYyNSwiZW5kIjo4NjQ4fS
wiRE9vbDdKSVhPT2JMRXRYRiI6eyJ0ZXh0IjoiV2Uga25vdyBm
b3IgaW5zdGFuY2UgdGhlIHByb2JhYmlsaXR5IG9mIGJlaW5nIG
9ycGhhbmVkIGlzIFwic21hbGxcIiwgYnV0IHdlIGRvIG5v4oCm
Iiwic3RhcnQiOjExMzExLCJlbmQiOjExNDQxfSwiS1VVUFduSD
MxMFlQUDZuRCI6eyJ0ZXh0IjoiY29uZmlybWF0aW9uQ29uZmlk
ZW5jIiwic3RhcnQiOjEyNzc4LCJlbmQiOjEyNzk5fSwiZzJNRn
g5Y0Jab2hTRXdRZSI6eyJ0ZXh0IjoiUmVjYWxsIHQiLCJzdGFy
dCI6MTMxNDcsImVuZCI6MTMxNTV9LCJlY1JUMHVnNE9MVXVaem
NjIjp7InRleHQiOiJoZSBmb2xsb3dpbmciLCJzdGFydCI6MTUy
NTEsImVuZCI6MTUyNjN9LCJDTnNYQnZBM0R6OElnNlhpIjp7In
RleHQiOiJUaXBzIHNlbGVjdGlvbiIsInN0YXJ0Ijo1NDM0LCJl
bmQiOjU0NDd9LCJsQnZndGJHYUJUdmZWU1lnIjp7InRleHQiOi
JJb3RhIiwic3RhcnQiOjc0ODUsImVuZCI6NzQ4OX0sIlVzUGxa
RTFYQXVzMDdTTDAiOnsidGV4dCI6IndlYWsgTmFzaCBlcXVpbG
licml1bToiLCJzdGFydCI6NzI3NiwiZW5kIjo3Mjk4fSwiUEpC
eHdKZmFNQzBjMEs2aSI6eyJ0ZXh0IjoiYmxvdyBiYWxsIGF0dG
Fja3MiLCJzdGFydCI6NzQzMSwiZW5kIjo3NDQ4fSwiaVNhTUxt
c002ZU1LQ2p4SiI6eyJ0ZXh0IjoiV2l0aCBhIGxhcmdlIGBEZW
x0YWAsIGhvbmVzdCBtZXNzYWdlcyB3aWxsIGVzc2VudGlhbGx5
IG5ldmVyIGJlIG9ycGhhbmVkLiIsInN0YXJ0Ijo3Njk2LCJlbm
QiOjc3Njl9LCJnVkVKQjV1SklwY0V4TTNzIjp7InRleHQiOiJm
b2xsb3dpbmcgYXR0YWNrIiwic3RhcnQiOjgzNDEsImVuZCI6OD
M1N30sIkdOYkQ3SmhVdHg5aGNYcVMiOnsidGV4dCI6Im9ycGhh
bmVkIiwic3RhcnQiOjkzNjgsImVuZCI6OTM3Nn0sIm5xRjdjbG
NYOFB2cjlubFUiOnsidGV4dCI6IkZpbmFsaXR5Iiwic3RhcnQi
OjExNDUzLCJlbmQiOjExNDYxfSwiR0Z6Y3REUVJ5RmZ6eTl2eC
I6eyJ0ZXh0IjoiUGVyaW9kaWNhbGx5Iiwic3RhcnQiOjYyNTQs
ImVuZCI6NjI2Nn0sIjUyNncxMEI5UXhMN2RHWWYiOnsidGV4dC
I6IkdyYWRlIDEiLCJzdGFydCI6MTIzMDIsImVuZCI6MTIzMDl9
LCJ1Y3FTcWpGTFhQdnN1VkdUIjp7InRleHQiOiJSZW1vdmUgbW
Vzc2FnZUlEIGZyb20gYHBlbmRpbmdgIGlmIHByZXNlbnRcbiog
UmVtb3ZlIG1lc3NhZ2VJRCBmcm9tIGBlbGlnaWJsZVRpcOKApi
IsInN0YXJ0IjoxNTI2NywiZW5kIjoxNTQwNH0sImxVOXY3Rncy
dFdIS0tuT2MiOnsidGV4dCI6IkRlbHRhPm1lc3NhZ2VJRC50aW
1lc3RhbXAtbWVzc2FnZUlELnBhcmVudDEudGltZVN0YW1wID4w
Iiwic3RhcnQiOjQ4NzQsImVuZCI6NDkzMH19LCJjb21tZW50cy
I6eyJYV0M3ckNXV3U5c0UzUjh2Ijp7ImRpc2N1c3Npb25JZCI6
ImtrRW9nVmh4cE9rWlZyV0UiLCJzdWIiOiJnaDo1MTExMjYxOC
IsInRleHQiOiJUaGlzIGlzIGEgc3Ryb25nIGFzc3VtcHRpb24g
YW5kIG1heSBiZSBpbnRlcnByZXRlZCBpbiBhIHdyb25nIHdheS
4gV2hhdCBoYXBwZW5zIG9mIG9uZSBtZXNzYWdlIGlzIG5vdCBk
ZWxpdmVyZWQgb24gdGltZT8gUHJvdG9jb2wgYnJlYWtzPyIsIm
NyZWF0ZWQiOjE1OTU1NzI2MjQ5MzN9LCJJYzlzZnd5VnA5eHZS
WGZJIjp7ImRpc2N1c3Npb25JZCI6Ik1STWplcmpoeTRiWUdFa2
8iLCJzdWIiOiJnaDo1MTExMjYxOCIsInRleHQiOiJJcyB0aGlz
IHRoZSBNZXNzYWdlIEluYm94IGZyb20gMS0zID8iLCJjcmVhdG
VkIjoxNTk1NTcyNzU1MzYxfSwiQVFnMm1pcjZ1WHBDT0kxNiI6
eyJkaXNjdXNzaW9uSWQiOiJNUk1qZXJqaHk0YllHRWtvIiwic3
ViIjoiZ2g6NTExMTI2MTgiLCJ0ZXh0IjoiUHJvYmFibHkgb25s
eSB0aGUgc3Vic2V0IHRoYXQgaXMgbm9uLWVsaWdpYmxlLiIsIm
NyZWF0ZWQiOjE1OTU1NzI3OTM2OTN9LCJGWVhVVzdVT1k1ZW9z
SkJqIjp7ImRpc2N1c3Npb25JZCI6IlhIV3RtcTluMGxjVVBIeW
4iLCJzdWIiOiJnaDo1MTExMjYxOCIsInRleHQiOiJtZXNzYWdl
SUQ/IiwiY3JlYXRlZCI6MTU5NTU3Mjk4NjgxN30sImF5VFprUG
s3cll0TmJBWkMiOnsiZGlzY3Vzc2lvbklkIjoibFdNRGFpNFds
QzlHdnBlcSIsInN1YiI6ImdoOjUxMTEyNjE4IiwidGV4dCI6Im
5vdCBjbGVhciB3aXRob3V0IGtub3dpbmcgd2hhdCBpdCBpcyBh
bHJlYWR5IiwiY3JlYXRlZCI6MTU5NTU3MzQ0MDI1M30sIkFnRk
5OWEhrcU1MZ1c1M2siOnsiZGlzY3Vzc2lvbklkIjoiSHFkV1dE
VFBreE8yb3R1WiIsInN1YiI6ImdoOjUxMTEyNjE4IiwidGV4dC
I6ImRvbiB0IHVuZGVyc3RhbmQiLCJjcmVhdGVkIjoxNTk1NTcz
NDc5MTA4fSwiQllOUHV1RFpVTEpVUjZBZSI6eyJkaXNjdXNzaW
9uSWQiOiJoTkNLVERkZTM4YXU1WXV1Iiwic3ViIjoiZ2g6NTEx
MTI2MTgiLCJ0ZXh0IjoiU3RyaWN0bHkgc3BlYWtpbmcgdGhpcy
BpcyBub3QgYSB0aW1lLCBtb3JlIGEgcG9pbnQgaW4gdGltZSAo
d2UgYmVsaWV2ZSB0byBsaXZlIGluKS4gVU5JWC10aW1lPyIsIm
NyZWF0ZWQiOjE1OTU1NzQ1MzI4NzN9LCJaUHZ1b0ZMZ1ZyVW1Y
MmJHIjp7ImRpc2N1c3Npb25JZCI6IllaT2c3emMxcmJPR2ZsZF
oiLCJzdWIiOiJnaDo1MTExMjYxOCIsInRleHQiOiJ3aGVyZSB3
aWxsIHRoZXkgYmUgc3RvcmVkPyIsImNyZWF0ZWQiOjE1OTU1Nz
Q2MzY1Nzl9LCJLaTZtZGlvUFNHaU9LanNXIjp7ImRpc2N1c3Np
b25JZCI6IjhabUNFc2loelhKRk05MTIiLCJzdWIiOiJnaDo1MT
ExMjYxOCIsInRleHQiOiJtYWtlIGNvbnNpc3RlbnQ7IHN0YXJ0
IHVwcGVyIG9yIGxvd2VyIGNhc2UgYWZ0ZXIgJyAnLCBvciB1c2
UgOiA/IiwiY3JlYXRlZCI6MTU5NTU3NDc2NzA1OX0sInEzT1E5
Qm9nbzQ4aFU0VHAiOnsiZGlzY3Vzc2lvbklkIjoiOFptQ0VzaW
h6WEpGTTkxMiIsInN1YiI6ImdoOjUxMTEyNjE4IiwidGV4dCI6
InVzZSB0aGUgc2FtZSB0aHJvdWdob3V0IHRoZSBzcGVjcyIsIm
NyZWF0ZWQiOjE1OTU1NzQ4MTI3MTZ9LCJ2WWozNFV6SEZ0T3Vr
SHNIIjp7ImRpc2N1c3Npb25JZCI6Ik9xWWRyWXN5YXJiSG9ZRW
ciLCJzdWIiOiJnaDo1MTExMjYxOCIsInRleHQiOiJjdXJyZW50
IGxvY2FsIHRpbWU/IiwiY3JlYXRlZCI6MTU5NTU3NTAwOTI2NX
0sImFhUjUzUmJaanJhTlFoam8iOnsiZGlzY3Vzc2lvbklkIjoi
T3FZZHJZc3lhcmJIb1lFZyIsInN1YiI6ImdoOjUxMTEyNjE4Ii
widGV4dCI6ImlmIGl0IHJlZmVycyB0byB0aGUgdmFyaWFibGUg
YGN1cnJlbnQgdGltZWBhZGQgdGhlc2UgYHMiLCJjcmVhdGVkIj
oxNTk1NTc1MDg2Mzk5fSwidktHQUVjN0VkM0RMM0M1cyI6eyJk
aXNjdXNzaW9uSWQiOiJMUnN1THBLY28yMFRsVGUzIiwic3ViIj
oiZ2g6NTExMTI2MTgiLCJ0ZXh0IjoiQlRXIHdoZXJlIGlzIGl0
IHNwZWNpZmllZCBob3cgdG8gY2hvb3NlIHcgYW5kIHRoZSBvdG
hlciBwYXJhbWV0ZXJzPyIsImNyZWF0ZWQiOjE1OTU1NzUxNDM0
Mzd9LCJUcDNQeFlVbU44RHB1dmVrIjp7ImRpc2N1c3Npb25JZC
I6ImZSZ3NGWm5yVGNmZTI0YjMiLCJzdWIiOiJnaDo1MTExMjYx
OCIsInRleHQiOiJJcyB0aGlzIGFmdGVyIHRoZSBtZXNzYWdlIH
Bhc3NlZCB0aGUgcmF0ZSBtYW5hZ2VyPyBJZiB5ZXMsIEkgbSBh
IGJpdCBjb25mdXNlZCwgbm9kZSB3aXRoIGRpZmZlcmVudCBtYW
5hIHBlcmNlcHRpb24gbWlnaHQgaGFuZGxlIHRoZSBtZXNzYWdl
IGRpZmZlcmVudGx5IiwiY3JlYXRlZCI6MTU5NTU3NTU2MzE3MH
0sIlY0ZEtiZndRN1BYQkZJYzYiOnsiZGlzY3Vzc2lvbklkIjoi
SjZpckhyRXVVbFJpTVIwZSIsInN1YiI6ImdoOjUxMTEyNjE4Ii
widGV4dCI6IkRvZXMgdGhpcyBjb21lIGJlZm9yZSB0aGUgYWJv
dmUgc3RlcCBvciBhZnRlcj8gQSBncmFwaCBsaWtlIGluIDEtMy
BzaG93aW5nIHRoZSBwcm9jZXNzZXMgbWlnaHQgYmUgZ29vZCIs
ImNyZWF0ZWQiOjE1OTU1NzYxMjU3MzF9LCJMUHZVdERRNU9lbG
s4eUM1Ijp7ImRpc2N1c3Npb25JZCI6Iko2aXJIckV1VWxSaU1S
MGUiLCJzdWIiOiJnaDo1MTExMjYxOCIsInRleHQiOiJPciBpcy
B0aGlzIGNvbnRhaW5lZCBpbiB0aGUgdGltZXN0YW1wIGNoZWNr
IGluIDEtMz8iLCJjcmVhdGVkIjoxNTk1NTc2Mjk2MjU2fSwiaz
NYRFhVUmgxeXQ1aTd3VyI6eyJkaXNjdXNzaW9uSWQiOiJqU3dm
T2NtWjNCdWFqcm9TIiwic3ViIjoiZ2g6NTExMTI2MTgiLCJ0ZX
h0IjoiZG9uIHQgdW5kZXJzdGFuZD8gSXMgdGhpcyBnZXRUaXAg
Zm9yIG5ldyBtZXNzYWdlLklEPyIsImNyZWF0ZWQiOjE1OTU1Nz
Y5MjM2Mjh9LCI1WHZzU0x6MHFuR3RmYXFiIjp7ImRpc2N1c3Np
b25JZCI6Im1lQ0VJcFo1eExNS3VjZ00iLCJzdWIiOiJnaDo1MT
ExMjYxOCIsInRleHQiOiJ3aGVyZSBpcyB0aGlzIGRlZmluZWQ/
IiwiY3JlYXRlZCI6MTU5NTU3NzE4MTI1OX0sIndldE82RkFPYW
RiWTRaZWUiOnsiZGlzY3Vzc2lvbklkIjoiRE9vbDdKSVhPT2JM
RXRYRiIsInN1YiI6ImdoOjUxMTEyNjE4IiwidGV4dCI6IlRoaX
Mgc2hvdWxkIGJlIGNhbGN1bGFibGUuIFVuZGVyIHNvbWUgYXNz
dW1wdGlvbnMgb2YgbWFsaWNpb3VzIG1wcyBhbmQgaG9uZXN0IG
1wcyBldmVuIHRoZW9yZXRpY2FsbHkuIiwiY3JlYXRlZCI6MTU5
NTU3NzYzMTc1Nn0sImxqd29TczdBT1pVNGVHM3EiOnsiZGlzY3
Vzc2lvbklkIjoiS1VVUFduSDMxMFlQUDZuRCIsInN1YiI6Imdo
OjUxMTEyNjE4IiwidGV4dCI6IklzIHRoaXMgdGhlIGRlZmluaX
Rpb24gb2YgY29uZmlkZW5jZSBsZXZlbD8iLCJjcmVhdGVkIjox
NTk1NTc3OTY1MzMxfSwiZUtDSUVvU3cyOHFwVUtYTiI6eyJkaX
NjdXNzaW9uSWQiOiJnMk1GeDljQlpvaFNFd1FlIiwic3ViIjoi
Z2g6NTExMTI2MTgiLCJ0ZXh0Ijoid2hlcmUgaXMgdGhpcyBkZW
ZpbmVkPyIsImNyZWF0ZWQiOjE1OTU1NzgwMjg3MDF9LCJEVHFk
aEExOGgxd3BSd251Ijp7ImRpc2N1c3Npb25JZCI6ImVjUlQwdW
c0T0xVdVp6Y2MiLCJzdWIiOiJnaDo1MTExMjYxOCIsInRleHQi
OiJpcyB0aGVyZSBhIGNoYW5jZSB0aGF0IGEgbWVzc2FnZSBnZX
RzIHRyYXBwZWQgaW4gdGhlIE1lc3NhZ2UgSW5ib3ggYW5kIGhh
cyB0byBiZSByZW1vdmVkIHRvbz8iLCJjcmVhdGVkIjoxNTk1NT
c4NDg4NTUxfSwiYmVvOTR3dWNXWmlMR2FKWiI6eyJkaXNjdXNz
aW9uSWQiOiJDTnNYQnZBM0R6OElnNlhpIiwic3ViIjoiZ2g6NT
ExMTI2MTgiLCJ0ZXh0IjoiV2hhdCBoYXBwZW5zIGlmIGVsaWdp
YmxlVGlwc0xpc3QgaXMgZW1wdHkgZm9yIGFsbCBub2Rlcz8gU2
hvdWxkIG50IHdlIHRoaW5rIGFib3V0IGhhbmRsaW5nIHRoaXMg
Y2FzZT8iLCJjcmVhdGVkIjoxNTk1NTc4NjMxMTM2fSwickdUcj
FWRjBtRlFjamQyOCI6eyJkaXNjdXNzaW9uSWQiOiJMUnN1THBL
Y28yMFRsVGUzIiwic3ViIjoiZ2g6NjgyNTAzNTAiLCJ0ZXh0Ij
oiVXN1YWxseSBTZXJndWVpIHNheXMgXCJQdXQgYW55IHJlYXNv
bmFibGUgaW5pdGlhbCBwYXJhbWV0ZXIgYW5kIHdlIGNoYW5nZS
BhZnRlciB0ZXN0aW5nXCIuIiwiY3JlYXRlZCI6MTU5NTg3OTM3
NzcwMH0sImU3SllaRGlQcGszR3hqQWUiOnsiZGlzY3Vzc2lvbk
lkIjoiSjZpckhyRXVVbFJpTVIwZSIsInN1YiI6ImdoOjY4MjUw
MzUwIiwidGV4dCI6IkZyb20gdGhlIGxhc3QgZGlzY3Vzc2lvbi
Bmcm9tIHRoZSBncm91cCwgQk1EIGNoZWNrIGlzIHBhcnQgb2Yg
c29saWRpZmljYXRpb24sIHBlaGFwcyB3ZSBuZWVkIHRvIGNoYW
5nZSBzZXNzaW9ucyB0byByZWZsZWN0IHRoaXM/IEkgd2lsbCBk
aXNjdXNzIHRoaXMgaW4gdGhlIHByb3RvY29sIGNhbGwgdG9tb3
Jyb3chIiwiY3JlYXRlZCI6MTU5NTg3OTcwMjM3Mn0sIkVSNG1L
QnBFN01hMlQ1NmUiOnsiZGlzY3Vzc2lvbklkIjoibEJ2Z3RiR2
FCVHZmVlNZZyIsInN1YiI6ImdoOjY4MjUwMzUwIiwidGV4dCI6
IklPVEEiLCJjcmVhdGVkIjoxNTk1ODgwMDc0MjUzfSwiTFo0cm
taRlRjN3hmSTY5UiI6eyJkaXNjdXNzaW9uSWQiOiJVc1BsWkUx
WEF1czA3U0wwIiwic3ViIjoiZ2g6NjgyNTAzNTAiLCJ0ZXh0Ij
oiSXMgaXQgb2sgdG8gdXNlIHRoZSBtYXRoZW1hdGljYWwgdGVy
bWlub2xvZ3kgaGVyZT8iLCJjcmVhdGVkIjoxNTk1ODgwNzQwNT
AxfSwicHV5SERjZjJVZlZuZHJvQiI6eyJkaXNjdXNzaW9uSWQi
OiJQSkJ4d0pmYU1DMGMwSzZpIiwic3ViIjoiZ2g6NjgyNTAzNT
AiLCJ0ZXh0IjoiV2UgbmVlZCB0byBkZWZpbmUgYXR0YWNrcyBz
b21ld2hlcmUuIEFsc28sIGRvZXMgaXQgbWFrZSBzZW5zZSB0by
BoYXZlIGEgYmxvd2JhbGwgYXR0YWNrIHdpdGggbm8gbWlsZXN0
b25lcz8iLCJjcmVhdGVkIjoxNTk1ODgwODAzMzg4fSwiT3lEUH
lzck1KY2MwZW5WbiI6eyJkaXNjdXNzaW9uSWQiOiJpU2FNTG1z
TTZlTUtDanhKIiwic3ViIjoiZ2g6NjgyNTAzNTAiLCJ0ZXh0Ij
oiSSBiZWxpZXZlIHdlIGNhbiBiZSBwcmVjaXNlIGhlcmUgd2l0
aCBzb21lIG1hdGggZnJvbSBUUy4uLiIsImNyZWF0ZWQiOjE1OT
U4ODA4NjgwNDl9LCJ0THFETm9jTnRKMldPSkZGIjp7ImRpc2N1
c3Npb25JZCI6ImdWRUpCNXVKSXBjRXhNM3MiLCJzdWIiOiJnaD
o2ODI1MDM1MCIsInRleHQiOiJQZWhhcHMgYSBzZWN0aW9uIGRl
c2NyaWJpbmcgcG9zc2libGUgYXR0YWNrcyB3b3VsZCBtaWtlIH
RoZSBmaWxlIGNsZWFuZXIiLCJjcmVhdGVkIjoxNTk1ODgxMTEx
NTY3fSwiUk1pME1yUVJKVHBFUkFnNCI6eyJkaXNjdXNzaW9uSW
QiOiJHTmJEN0poVXR4OWhjWHFTIiwic3ViIjoiZ2g6NjgyNTAz
NTAiLCJ0ZXh0IjoiV2UgbmVlZCB0byBkZWZpbmUgdGhlIHRlcm
0gXCJvcnBoYW5hZ2VcIiBiZWZvcmUgdXNpbmcgaXQiLCJjcmVh
dGVkIjoxNTk1ODgxMzg1NTI0fSwibmdtaVJIT1BsTFlRMDZVbC
I6eyJkaXNjdXNzaW9uSWQiOiJucUY3Y2xjWDhQdnI5bmxVIiwi
c3ViIjoiZ2g6NjgyNTAzNTAiLCJ0ZXh0IjoiRm9sbG93aW5nIF
NlYmFzdGlhbnMgQ29tbWVudHMgSSB3b3VsZCBzdWdnZXN0IHRo
aXMgc2VjdGlvbiB0byBjb21lIGJlZm9yZSwgc2luY2Ugd2UgbW
FueSB0aW1lcyB0YWxrIGFib3V0IG9ycGhhbmFnZSBhbmQgZmlu
YWxpdHkgYmVmb3JlLiIsImNyZWF0ZWQiOjE1OTU4ODIyMzgyNz
B9LCI0Y00yRThBZ0FsbDAzNDdiIjp7ImRpc2N1c3Npb25JZCI6
IkdGemN0RFFSeUZmenk5dngiLCJzdWIiOiJnaDo2ODI1MDM1MC
IsInRleHQiOiJUaGlzIHNob3VsZCBpbmR1Y2UgYSBuZXcgcGFy
YW1ldGVyIiwiY3JlYXRlZCI6MTU5NTg5NzI0ODMwNn0sIlA2NW
9Fc0FEV29nTHZxa0UiOnsiZGlzY3Vzc2lvbklkIjoiNTI2dzEw
QjlReEw3ZEdZZiIsInN1YiI6ImdoOjY4MjUwMzUwIiwidGV4dC
I6IldlIGluaXRpYWxseSBpbnRyb2R1Y2VkIDQgZ3JhZGVzLCBz
byB3ZSBjb3VsZCBoYXZlIG9uZSBraW5kIG9mIGZpbmFsaXR5IG
luIHNvbWUgc2Vjb25kcyAodGhlIHNtYWxsIG5ldHdvcmsgZGVs
YXkgd2l0aCBubyBjb25mbGljdHMpLCBJIGZlZWwgbGlrZSBjaG
FuZ2luZyBpdCBpcyBiYWQgZm9yIFBSLiIsImNyZWF0ZWQiOjE1
OTU4OTc5ODM4MzB9LCIzSHhFc2R1UXMxVXFMblpCIjp7ImRpc2
N1c3Npb25JZCI6InVjcVNxakZMWFB2c3VWR1QiLCJzdWIiOiJn
aDo2ODI1MDM1MCIsInRleHQiOiJTaG91bGRuJ3QgdGhpcyBiZS
BpbiBwc2V1ZG8tQWxnb3JpdGhtPyIsImNyZWF0ZWQiOjE1OTU4
OTg4MDkxNzF9LCJxRlJzcmhtOUZJSmF0dk5UIjp7ImRpc2N1c3
Npb25JZCI6ImxVOXY3RncydFdIS0tuT2MiLCJzdWIiOiJnaDo1
MTExMjYxOCIsInRleHQiOiJJbiBwYXJ0aWN1bGFyLCB0aGlzIG
VuZm9yY2VzIG1vbm90b25pY2l0eSBvZiB0aW1lc3RhbXBzLCBc
Ij4wXCIsIFRoaXMgaXMgc29tZWhvdyBoaWRkZW4gaGVyZSBhbm
Qgc2hvdWxkIGJlIG1vdmVkIHRvIFRpbWVzdGFtcENoZWNrIiwi
Y3JlYXRlZCI6MTU5NTkxNTI4MDA0OX0sIk5tblowMW1iT0I4R3
RYS2IiOnsiZGlzY3Vzc2lvbklkIjoia2tFb2dWaHhwT2taVnJX
RSIsInN1YiI6ImdoOjUwNjYxODQ0IiwidGV4dCI6IkJhc2ljYW
xseS4gIEEgbm9kZSBpcyB0aHJvd24gb3V0IG9mIHN5bmMuIiwi
Y3JlYXRlZCI6MTU5NTkyNTA2MTQ2OH0sIk1OV2g1bzJ4QWxXa2
5ORTAiOnsiZGlzY3Vzc2lvbklkIjoibFdNRGFpNFdsQzlHdnBl
cSIsInN1YiI6ImdoOjUwNjYxODQ0IiwidGV4dCI6IkltIG5vdC
BzdXJlIGhvdyB0byBkZWZpbmUgaXQgaW4gY29uY2lzZSB3YXku
IiwiY3JlYXRlZCI6MTU5NTkyNTExMDY2OH0sIlFITHoxVEVDa0
NFc3pTQTkiOnsiZGlzY3Vzc2lvbklkIjoiTVJNamVyamh5NGJZ
R0VrbyIsInN1YiI6ImdoOjUwNjYxODQ0IiwidGV4dCI6IlRoZS
BlbGlnaWJpbGl0eSBzdGF0dXMgaXMgcGVuZGluZyIsImNyZWF0
ZWQiOjE1OTU5MjUyMDk2NDJ9LCJIdXQ0a09Xb043MlZwVTY3Ij
p7ImRpc2N1c3Npb25JZCI6IlhIV3RtcTluMGxjVVBIeW4iLCJz
dWIiOiJnaDo1MDY2MTg0NCIsInRleHQiOiJUaGlzIGhhcyB0by
BiZSBkZWZpbmVkIGluIGFub3RoZXIgc3BlY2lmaWNhdGlvbjog
dGhlIGhhc2ggb2YgZWFjaCBtZXNzYWdlIGlzIHRoZSBNZXNzYW
dlSUQiLCJjcmVhdGVkIjoxNTk1OTI1MjU2MjQ2fSwiM3lqTjBV
bUx6dzVTbUlHMiI6eyJkaXNjdXNzaW9uSWQiOiJoTkNLVERkZT
M4YXU1WXV1Iiwic3ViIjoiZ2g6NTA2NjE4NDQiLCJ0ZXh0Ijoi
SSB0aGluayBpdCB3aWxsIGJlIFVOSVggdGltZSIsImNyZWF0ZW
QiOjE1OTU5MjUyODczMDZ9LCI3aDlMeFVCRUdudHdRVk8yIjp7
ImRpc2N1c3Npb25JZCI6IllaT2c3emMxcmJPR2ZsZFoiLCJzdW
IiOiJnaDo1MDY2MTg0NCIsInRleHQiOiJUaGF0IGlzIGJleW9u
ZCB0aGUgc2NvcGUgb2YgdGhpcyBkb2N1bWVudCIsImNyZWF0ZW
QiOjE1OTU5MjUzMzg4MTh9LCJ6VFNpSGYxM0hsVmloRWk0Ijp7
ImRpc2N1c3Npb25JZCI6IjhabUNFc2loelhKRk05MTIiLCJzdW
IiOiJnaDo1MDY2MTg0NCIsInRleHQiOiJJIGRvbnQgdW5kZXJz
dGFuZD8iLCJjcmVhdGVkIjoxNTk1OTI1NDM5ODc4fSwibzRPeV
A1MTNFbkI5d2h2ayI6eyJkaXNjdXNzaW9uSWQiOiJmUmdzRlpu
clRjZmUyNGIzIiwic3ViIjoiZ2g6NTA2NjE4NDQiLCJ0ZXh0Ij
oiVGhhdCBpcyB0cmVhdGVkIGluIHRoZSBkYXRhIHByb2Nlc3Np
bmcgc3BlYyIsImNyZWF0ZWQiOjE1OTU5MjU1MDAxNzh9LCJGST
RLbU5pQ2gyV0xINTcwIjp7ImRpc2N1c3Npb25JZCI6Iko2aXJI
ckV1VWxSaU1SMGUiLCJzdWIiOiJnaDo1MDY2MTg0NCIsInRleH
QiOiJUaGlzIDEsMiwzIGlzIGxpc3RlZCBpbnQgaGUgZGF0YSBw
cm9jZXNzaW5nIHNwZWMsIHNpbmNlIHRoZXNlIGNvbXBvbmVudH
MgYXJlIGludGVydHdpbmVkIHdpdGggdGhlIG90aGVyIHBhcnRz
IG9mIHRoZSBwcm90b2NvbC4iLCJjcmVhdGVkIjoxNTk1OTI1NT
YyODEwfSwiVGloeW5XMEtPTjU4cHRQUiI6eyJkaXNjdXNzaW9u
SWQiOiJsVTl2N0Z3MnRXSEtLbk9jIiwic3ViIjoiZ2g6NTA2Nj
E4NDQiLCJ0ZXh0IjoiVGhpcyBpcyBhIGJlbG93IG1heCBkZXB0
aCBpc3N1ZS4gIFRocmVlIGlzIGEgaGFyZCBjcml0ZXJpb24gdG
ltZXN0YW1wIGNyaXRlcmlvbiB0aGV5IG5lZWQgdG8gc2F0aXNm
eS4iLCJjcmVhdGVkIjoxNTk1OTI1NjM5MDc4fSwiRVBnVHlRMG
pMM3FOQWJUNiI6eyJkaXNjdXNzaW9uSWQiOiJDTnNYQnZBM0R6
OElnNlhpIiwic3ViIjoiZ2g6NTA2NjE4NDQiLCJ0ZXh0IjoiVG
hlIHRhbmdsZSBkaWVzLiAgSSBkb250IHRoaW5rIHRoaXMgaXMg
bGlrZWx5LiIsImNyZWF0ZWQiOjE1OTU5MjU3MjM2NjZ9LCJxWE
54S1Z3Q3R0cnViS0NvIjp7ImRpc2N1c3Npb25JZCI6IkdGemN0
RFFSeUZmenk5dngiLCJzdWIiOiJnaDo1MDY2MTg0NCIsInRleH
QiOiJJIHRoaW5rIHRoaXMgYmVoYXZpb3IgaXMgbGVmdCB0byB0
aGUgZGlzY3JldGlvbiBvZiB0aGUgbm9kZSBpbXBsZW1lbnRhdG
lvbiIsImNyZWF0ZWQiOjE1OTU5MjU4MTcyOTJ9LCJvOEprTG5S
UTNEWDVvYW0wIjp7ImRpc2N1c3Npb25JZCI6ImpTd2ZPY21aM0
J1YWpyb1MiLCJzdWIiOiJnaDo1MDY2MTg0NCIsInRleHQiOiJX
ZSBrZWVwIG9uIHNlbGVjdGluZyB1bnRpbGwgd2UgZ2V0IGEgdG
lwIHdlIGNhbiBhcHByb3ZlLiIsImNyZWF0ZWQiOjE1OTU5MjU5
Mzc1NjB9LCJmQ0FKQ25nMjdscGtLOU9QIjp7ImRpc2N1c3Npb2
5JZCI6IlVzUGxaRTFYQXVzMDdTTDAiLCJzdWIiOiJnaDo1MDY2
MTg0NCIsInRleHQiOiJJIGhhdmUgbm8gaWRlYSEiLCJjcmVhdG
VkIjoxNTk1OTI1OTU0NzUwfSwibGI3VWJTN2FWNWJPWVc3ZyI6
eyJkaXNjdXNzaW9uSWQiOiJHTmJEN0poVXR4OWhjWHFTIiwic3
ViIjoiZ2g6NTA2NjE4NDQiLCJ0ZXh0IjoiSSB0aG91Z2h0IGl0
IHdhcyBvbmUgb2Ygb3VyIHN0YW5kYXJkIHdvcmRzPyIsImNyZW
F0ZWQiOjE1OTU5MjYzNTkyMzN9LCJvYWFWVlFQNkw0aENtbVI2
Ijp7ImRpc2N1c3Npb25JZCI6IkRPb2w3SklYT09iTEV0WEYiLC
JzdWIiOiJnaDo1MDY2MTg0NCIsInRleHQiOiJJIGFncmVlLiAg
QnV0IHdlIGhhdmVudCBkb25lIGl0IHlldC4iLCJjcmVhdGVkIj
oxNTk1OTI2MzgzODk0fSwic25LNGJocXlUSW4xRTc0TiI6eyJk
aXNjdXNzaW9uSWQiOiJucUY3Y2xjWDhQdnI5bmxVIiwic3ViIj
oiZ2g6NTA2NjE4NDQiLCJ0ZXh0IjoiSXRzIHRyaWNreSBiZWNh
dXNlIGhvdyBjYW4geW91IHJlYWxseSBtYWtlIHNlbnNlIG9mIG
ZpbmFsaXR5IGJlZm9yZSBjb3ZlcmluZyB0aXAgc2VsZWN0aW9u
IGFuZCBlbGlnaWJpbGl0eS4gIFRoZSByYXRpb25hbGVzIGFyZW
50IHZlcnkgbGluZWFyLiIsImNyZWF0ZWQiOjE1OTU5MjY0NjU0
NDV9LCJTNnJWVlhSdWdSU1FHVUVkIjp7ImRpc2N1c3Npb25JZC
I6IktVVVBXbkgzMTBZUFA2bkQiLCJzdWIiOiJnaDo1MDY2MTg0
NCIsInRleHQiOiJZZXMiLCJjcmVhdGVkIjoxNTk1OTI2NTg5Nj
g4fSwiZHBFdDJzQ0FtcDRuWHc3dSI6eyJkaXNjdXNzaW9uSWQi
OiJlY1JUMHVnNE9MVXVaemNjIiwic3ViIjoiZ2g6NTA2NjE4ND
QiLCJ0ZXh0IjoiTm8uICBFdmVyeXRoaW5nIGxlYXZlcyB0aGUg
aW5ib3ggZGV0ZXJtaW5pc3RpY2FsbHkiLCJjcmVhdGVkIjoxNT
k1OTI2NjU5ODE0fX0sImhpc3RvcnkiOlsxNzU4Mzc5MjkyLC0x
NTY2MzkxNzQ2LC0xMTAyMzM0Nzk0XX0=
-->
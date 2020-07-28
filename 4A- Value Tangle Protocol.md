This note details how the value tangle will be managed.

Created June 12th.


# Summary

In this specification, we outline the value tangle management, which forms the backbone of the value transafer application.  In this specification, we describe how transfers are verified, decided upon, and recorded.  


We highly recommend first reading the [message tangle specification](https://https://hackmd.io/YfrUh4wqSua0Ou4-XHwYIA?both).  Overall the message tangle is much simpler because it has no conflicts.  However, the basic tangle management is described in great detail.  Instead of retyping many of these explanations, we will often simply refer the reader to that speicification. 

This specification covers a lot of information.  For the reader's ease, the Components section is broken up into the following subsections, each one formatted as a small specification. 

1. Timestamps
2. Indexed transactions and reattachments
3. Solidification
4. Conflict detection 
5. Tip Selection
6. Correction Check
7. Finality
8. Snapshotting

# Preliminaries
## Parameters, lists, and functions
The following are parameters.  
* `d` Estimation of network delay ~5 seconds. We assume all messages arrive at almost all  nodes in this time.  
* `c` FCoB parameter ~d.
* `D` Gratuitous network delay~5 minutes.  We assume all messages are delivered to all nodes within this time.  This parameter is also used in the message tangle.  
* `w` window~30 minutes. Require `w>2D`. This parameter is also used in the message tangle.
* `DeltaValue` max difference in consecutive timestamps. Require `DeltaValue>w+D`.  This parameter is similar to `Delta` on the message tangle. 
* `epoch` is the length of time of each index.
* `correctionCheckTime` the time till the correction check
* `theta` confidence level of grade 3 finality for messages.  
* `T` time for grade 4 finality 
* `snapShotTimeValue` Age of a transaction when snapshotted. Require `snapSshotTimeValue>DeltaValue+w+2D` This parameter is similar to `snapShotTime` on the message tangle, alathough this parameter is global: it must be the same for all nodes.   


The following are lists.
* `valueTangle` The database of value objects.
* `transactionList` The database of all transactions. 
* `indexedTxList` is the database of indexed transactions: see Main Components Subsection 1 below.
*  `eligibleValueTipsList` The value objects eligible for the selection algorithm.  
* `pending` The value objects not initially eligible for tip selection.  
* `correctionQueue` An ordered list of transactions whose eligibility flag must be checked again.
* `snapShotFile` which is discussed in Components Subsection 8.
* `recentlyBookedQueue` an ordered list of value objects that were snapshotted.
* `transactionsBookedThisEpoch` lists the transactions that were booked in this epoch.
In implementations, many of these lists can exist simply as flags on objects in `valueTangle`.   

We use the following variable
* `currentTime` which gives the current time of the node.  


We define the following functions.
* `isSolid` Determines if a value object is solid or not
* `belowMaxDepthCheck` Determines if a value object satisfies the below max depth criterion. 
* `getValueTip` Function which employs the tip selection algorithm on the value tangle.
* `valueConfirmationConfidence` Measures the number of approvers on the value tangle.


## How value objects and transactions are stored

Every value object and transaction can be identified by their `valueObjectID` and `transactionID` respectively.  Each value object contains the following information which is relevant to this specification:
* `parent1` and `parent2` These are value object IDmessage IDs of two other messages and endow the valumessage tangle with a DAG structure.  Together these fields shall be called *parents*.
* `transaction` this is the payload of each value object. 
* `timeStamp` which indicates the time the value object was created.  


Value objects will be stored with the following fields:
* `arrivalTime` The time that the value object was first parsed.  
* `eligible` is a Boolean value, denoting if the message was ever eligible for tip selection. 
* `container` is a list of the messages which have this value object as a payload.
* `solid` is a Boolean flag indicating if the parents are solidified or not.  
* `indexedTx` the indexed transaction associated to the value object.


We introduce an object called `indexedTx` or indexed transaction, which isn rigorously defined in Main Components Subsection 2 below. These objects will be stored in the list `indexedTxList` along with the following fields:
* `indexedTxID` is the hash of `index+indexedTxID.transaction`.  This hash uniquely identifies each indexed transaction.
* `transaction`  is the hash of the transaction it contains
* `index`  is coarse measurement of time: see Main Components Subsection 1 below.
* `container` which lists the value objects containing the transaction with that index.  
* `opinionField` Contains the opinion on the timestamp of a message.  As specified [here](https://hackmd.io/xBfQ04NkRi6IrwhEQm7aJQ), this field is a triple `(opinion,level,timeFormed)` where `opinion` is a Boolean value, `level` is in the set {1,2,3}, and `timeFormed` is a time. This `opinionField` is also manipulated by FPC.
* `arrivalTime` is the time the indexed transaction was created. 
 

Transactions contain a field `inputs` which lists the UTXO inputs it consumes, and a field `outputs` which lists the outputs created.  Recall from [the UTXO specification](https://) that each input has a `transaction` field. Transactions will be stored in `transactionList` along with the fields:
* `container` which is a list of `indexedTxID`s of the indexed transactions containing that transaction
In Components Subsection 8, we reference other fields in the transaction layout, but we refer the reader to the specification linked above.



# Main Components

As mentioned in the introduction, this section is divided into 9 subsections. To help orientate the reader, we briefly outline the actions performed on a value object.

After a message has been processed on the communication layer, it passes through the payload parser.  If the payload is a value object, the parser calls the `value object processor` which does the following actions.
1. Timestamp check 
2. Duplicate detector 
3. Conflict Check
4. Initial Eligibility Check

These actions are discussed in the first four sections.  



## 1. Timestamps

Every value object must have a timestamp in order to enable snapshotting, and these timestamps must be enforced through some consensus mechanism.  On the message tangle this is done through voting.  However, on this layer we do not want to vote on timestamps again.  Thus, we require that a value object must have the same timestamp as the message containing it.   

### Detailed design


When a value object is first parsed, we check if the timestamp of the value message is the same as its container, with the following check.
```
Input: valueObjectID, messageID

If valueObjectID.timeStamp not= messageID.timestamp
    Then Return INVALID
```
If this check is invalid, the value object ceases to be parsed and is deleted.


### Rationale

Since message timestamps are enforced through voting, the timestamps in the value tangle are also enforced. Since the timestamp is written in the value object, it is object and agreed upon by all.

### Alternatives

Alternatively, value objects can inherit their timestamp from their containing message. However, since a value object can be reattached in multiple messages, the timestamp is not well defined. To rectify this, we may let timestamp of a value object be the oldest timestamp of a message containing it. This definition is still problematic because the value of the timestamp can change. Later we will perform a below max depth check, but changing a timestamp can change the results of this check.  

Another alternative is to have value objects inherit the timestamp of their parent, but then differentiate different value objects contained in messages with different timestamps.  This latter approach is similar in spirit to the indexing which we mention below.  







## 2. Indexed transactions and reattachments

Value objects can be reattached multiple times in the message tangle, assuming the message has the correct timestamp.  Similarly, a transaction can be reattached multiple times by any party since neither messages nor value objects are signed by the account holders of the spent funds.  Transactions which are reattached should, in general, not be considered distinct.  If reattached transactions were considered conflicts, then the FCoB rule (see Subsection 4) would cancel both out. 

However, this approach precludes snapshotting: when receiving a transaction, a node would need to check its entire history for duplicates. This is simply not practical.  As a solution, we divide the timeline into "indices" or epochs. Transactions issued in the same index will be identified together in an object called `indexedTx` or an indexed transaction.  FPC will vote on indexed transactions.

### Detailed Design

First, after a new value object has passed the timestamp check, the node searches the value tangle for duplicates.  If it is a duplicate, no further action is taken besides updating the container field.  If the value object is not a duplicate, it can be added to the value tangle. 

After a value object is added to the value tangle, we create the indexed transaction object.  The timeline is divided up into periods which we call *epochs* which are each of length `epoch` which are enumerated chronologically.  The *index* of a value object is simply the epoch of its timestamp. The indexed transaction is then simply the hash of transaction ID and the index.  The indexed transaction identifies all the reattachments of a transaction issued in the same epoch while differentiating those issued in different epochs.   


We summarise these actions in the following pseudocode which we dub the `duplicate detector`.  Let `valueObjectID` be the hash of the value object, and suppose its contained in the message with hash `messageID`.
```
If valueObjectID in valueTangle, then add messageID to valueObjectID.container
Else 
    Add valueObjectID to value Tangle  
    Set valueObjectID.containter={messageID}
    Set valueObjectID.eligible=FALSE
    If valueObjectID.transaction in transactionList, then add valueObjectID to valueObjectID.transaction.container
    Else
        Add valueObjectID.transaction to transacitonList
        Set valueObjectID.transaction.container={valueObjectID}
        Set valueObjectID.transaction.eligible=False
    Set index=floor(valueobjectID.timestamp/epoch)
    Set indexedTxID=hash(index valueObjectID.transaction)
    Set valueObjectID.indexedTx=indexedTxID
    If indexedTxID in indexedTxList, then add valueobjectID to indexedTxID.container
    Else
        Add indexedTxID to indexedTxList
        Set indexedTxID.transaction=valueObject.transaction
        Set indexedTxID.index=index
        Set indexedTxID.container={valueobjectID}
        Set indexedTxID.opinionField=NULL
        Set indexedTxID.arrivalTime=currentTime
```


### Rationale

The indices create a well defined equivalence relation on the transactions. Moreover, if someone reattaches a transaction after a long period time, e.g. after snapshotting, the transaction will have a different index and will be considered distinct.  

###  Drawback

If the epochs are large, then when a transaction is reattached, it will have the same epoch.  However, if the a transaction arrives around the changing of an epoch, an attacker can censor this transaction by reattaching the transaction in the next epoch.  This would really only affect the transactions issued in the last 5 seconds of each epoch, but still could represent a problem.  




## 3. Solidification

A value object is solid if the node has its past cone.  Solidification on the value tangle works fundamentally differently than on the message tangle.  On the communication layer, a node can send solidification requests and nodes only gossip upon solidification.  Since the communication layer operates independently of the value transfer application, we do not have these tools here.  Thus, nodes must simply wait for value objects to solidify, and this application lacks any particular solidification module.

As a consequence, we vote even on unsolidifed transactions.  Since we can only wait for transactions to be solidified (see next subsection), this would allow an attacker to solidify big batches of transactions at once and overload ths network by solidifying large structures simultaneously.  

One might think that by voting on unsolidified transactions, an attacker can increase the number of votes taking place.  This is false: the number of votes taking place is limited by how many conflicts an attacker can create which is bounded by the number of messages they can issue.  This limit is set by the rate control module, and not be any solidification mechanism. 








## 4. Conflict detection 

At the core of the protocol, we use FPC to choose between conflicts by voting on indexed transactions. How FPC interacts with the value tangle is specified [here](https://hackmd.io/xBfQ04NkRi6IrwhEQm7aJQ).  In this section we define conflicts and discuss how the opinion field is initially set.  



### Detailed design

The following is our definition of conflict. **Two indexed transactions conflict if they have the same index and their associated transactions have overlapping inputs**.  Under this definition, reattachments are never conflicts because either they have different indices or they define the same indexed transaction.  

After the a indexed transaction `indexedTxID` is created, a node should check for conflicts.
```
Intialize list conflicts={}
Forall x in indexedTxList
    If indexedTxID.index=x.index AND (indexedTxID.transaction.inputs INTERSECT x.transaction.inputs) is not empty
    Then Add x to conflicts
If conflicts is not empty, then add indexedTxID to conflicts
```

If the list of conflicts is not empty, then we have to vote on each object in this list.  Thus, we have the set the initial opinion of each object using what is called the *FCoB rule*: an object is disliked if a conflict is detected before `arrivalTime+c` where `c` is the FCoB parameter.  (FCoB stands for Fast Consensus of Barcelona where we devised the rule.)  Since the decision time is based on the arrival time of messages, we can also set the level of knowledge flag based on the arrival time.  

Specifically, we perform the following algorithm on the list `conflicts`.
```
Forall x in conflicts
    If x.opinionField=Null
    Then
        Set x.opinionField.timeFormed=currentTime
        If currentTime<x.arrivalTime+c, then Set x.opinionField.opinion=FALSE
        If Abs(x.arrivalTime+c-currentTime)<D, then Set  x.opinionField.level=1
        Else 
            If Abs(x.arrivalTime+c-currentTime)<2D, then Set  x.opinionField.level=2
            Else Set x.opinionField.level=3
```

### Rationale

FPC is a binary voting protocol: it only votes yes or no on each indexed transaction.  Thus, we do not choose between conflicting transaction, but choose which value objects we approve. However, it is imperative that no pair of conflicting transactions approved by FPC, otherwise the ledger will become invalid. Recall that with the UTXO scheme, the ledger state will be valid if and only if no two transactions consume the same inputs.  

Suppose `tx1` and `tx2` are conflicting indexed transactions.  If roughly half the network has a positive initial opinion about `tx1` and the other half about `tx2`, then with a nonnegligible probability, FPC will output "good" on both indexed transactions, which is intolerable.  The FCoB rule prevents this situation.  Indeed, assuming `tx2` arrives to our node second, it will always be disliked by the most of the network.
1. Every node receives `tx1` before `tx2`.  In this case, under the FCoB rule, all nodes will initially dislike `tx2`
2. Not all nodes receive `tx1` before `tx2`.  Since our node received `tx1` before `tx2`, and since the network delay for most nodes is less than `c`, no node will receive `tx2`  time `c` before `tx1`, and thus all nodes will dislike `tx2` under the FCoB rule.

Since the FCoB rule is decided by the arrival times, we can use estimations of the network delay to determine the level of knowledge of our opinion in the same manner as timestamps on the message tangle: see [Components Subsection 1](https://hackmd.io/YfrUh4wqSua0Ou4-XHwYIA?both).  As with the message tangle we use `D`, the large estimate on the network delay, so nodes with longer message delays will not fall out of sync.  However, a smaller estimation of the network delay suffices to determine `c` because the arguments work in the previous paragraph if vast majority of nodes initially dislike  `tx2`.  Moreover, have `c=D` would cause intolerable confirmation times, as demonstrated by the tip selection algorithm below.



## 5. Tip Selection

The tip selection in algorithm on the value tangle works on the same principles as the message tangle.  We will perform RURTS on a restricted subset. This subset will be maintained by inductively maintaining a a subtangle of good value objects marked with the `eligible` flag.  

### Detailed design

We define the following function which determines if a value object should be flagged as eligible.  
```
Function Name: isEligible
Input: valueObjectID
Output: Boolean value

If valueObjectID.indexedTx.opinionField.opinion=FALSE, then Return FAlSE
If valueObjectID.indexedTx.opinionField.level=1, then Return FAlSE

If valueObjectID.parent1 not in valueTangle, then Return FALSE
If { DeltaValue>valueObjectID.timestamp-valueObjectID.parent1.timeStamp >0} is FALSE
    Then Return FALSE
If valueObjectID.parent1.eligible=FALSE, then Return False

If valueObjectID.parent2 not in valueTangle, then Return FALSE
If { DeltaValue>valueObjectID.timestamp-valueObjectID.parent2.timeStamp >0} is FALSE
    Then Return FALSE
If valueObjectID.parent2.eligible=FALSE, then Return False


Forall input in valueobjectID.transaction.inputs
    If input not in transactionList AND input not in snapShotFile.outputs, then Return False
    If input not in snapShotFile.outputs and (Forall X in  input.container, X.eligible=False AND X.timeStamp>valueObjectID.timeStamp)=FALSE
    Then Return False

If (Forall messageID in valueObjectID.container, messageID.elegible=FALSE)=FALSE, then Return False 

Return True
```

For a value object with ID `valueObjectID`, at time `valueObjectID.arrivalTime+d`, a node performs the *first eligiblity check*, checking if the object is eligible.
```
If isEligible(valueObjectID)=True
Then
    valueObjectID.elible=True
    valueObjectId.transaction.eligible=True
    Add (valueobjectID,currentTime) to end of correctionQueue
    Add valueObjectID to eligibleValueTipsList
    Remove valueObjectID.parent1 from eligibleValueTipsList
    Remove valueObjectID.parent2 from eligibleValueTipsList
Else Add valueObjectID to pending
```

Periodically, the node must check the pending list for newly eligible value objects.
```
Forall valueobjectID in pending
If isEligible(valueObjectID)=True
    Then
        Remove valueObjectID from pending
        valueObjectID.elible=True
        valueObjectId.transaction.eligible=True
        Add valueObjectID to eligibleValueTipsList
        Remove valueObjectID.parent1 from eligibleValueTipsList
        Remove valueObjectID.parent2 from eligibleValueTipsList   
```



We can now define the following function.
```
Function: getValueTip
Inputs: none
Outputs: valueObjectID

While (currentTime-valueObjectID.timeStamp<Delta) is FALSE
    Randomly select valueObjectID from eligibleValueTipsList
EndWhile
Return valueObjectID
```

### Rationale

As with the message tangle, the node checks each value object if it is eligible.  If not, the node puts the object in the buffer until it becomes eligible. The only difference is that a node must perform the first check at `c+d` to allow for any conflicts to be detected.  Otherwise, the tip selection algorithm here behaves exactly the same as on the message tangle: see [Components Subsection 3](https://hackmd.io/YfrUh4wqSua0Ou4-XHwYIA?both).  

However, the check for eligibility is more complicated and is combined with the below max depth check.    In particular, we only flag an object as eligible if it satisfies the following.
* The object has opinion field either Null, good level 2, or good level 3.  This means that either no conflict was detected, or it was and the voting has been resolved.
* Each parent is eligible and satisfies the below max depth criterion.
* Each UTXO input is contained in some eligible value object whose timestamp is older than the value object in question.
* The value object is contained in a message that is eligible for tip selection on the message tangle.  

These criterion are carefully chosen so that we ensure the following three things happen.
1. Only a solidified subtangle of value transactions are permanently stored in the ledger which contains a valid UTXO graph.  
2. The value objects in the value tangle are also recorded in messages which will not be orphaned.
3. That we are able to do snapshotting.  Indeed, the below max depth criterion between the timestamps of a value object and its parent allow for the same snapshotting capabilities that we have on the message tangle.  See  [Components Subsection 5](https://hackmd.io/YfrUh4wqSua0Ou4-XHwYIA?both).  Similarly, the timestamp requirement on the containers of the UTXO inputs allow us to determine conclusively when a transactions UTXO inputs will not become "solid": see Subsection BLANK below.





## 6. Correction check

The first check for eligibility happens when a value object is `c+d` old. However, since `c+d~2d~10 seconds`, if a node experiences a delay (such as a mild DDOS attack), a conflict might arrive after this check is performed, and the node may even arrive at the wrong initial opinion.  Since the levels of knowledge uses `large D`, the node will still come to the correct final opinion after running FPC.  But, the eligibility status must still be adjusted to matched this final opinion.  Moreover, other value objects may rely on one of these "delayed conflicts", complicating the process.

To summarise the following, we wait `correctionCheckTime` after the a value object was first flagged eligible.


### Detailed Design

Recall that `correctionQueue` is an ordered list of pairs `(valueObjectID,time)' representing the time each value object was flagged as eligible.  We want to recheck these value objects on a FIFO basis. Specifically, the following pseudo will continuously run in a loop.  
```
Forall (valueObjectID,time) in correctionQueue
	While time+D>currentTime
		Do nothing
	Endwhile
	If isEligible(valueObjectID)=FALSE, Set valueObjectID.eligible=FALSE
	Remove (valueObjectID,time) from correctionQueue
```

### Rationale


### Drawbacks

Suppose a node is slightly out of sync, for instance it is experience a mild DDoS attack.  Suppose further that the node falsely marks a value object `v` as eligible because the arrival of a conflict was delayed. The node may choose `v` in its tip selection process, and create a value object referencing it.  However, when `v` fails the correction check,   this new value object will be invalidated.  This may cause problems for the node is and is an attack vector.  Unfortunately, this is partly a consequence of FLP impossibility: if some message on the communication layer can be delayed indefinitely, then no node can every correctly finalise on the status of any transaction.  

### Alternatives

There are some intuitive ways to optomize this process.  First, the `isEligible` function checks way more than is necessary at this point.  Indeed, the timestamp checks and the message checks are completely unnecessary.  In fact, all that needs checked is
* The parents are still eligible
* Each UTXO input is contained in an eligible value object

Next, If a value object `v1` references value object `v2`, and `v2` fails the correction  check, then `v1` is also doomed to fail the correction check.  However, in the algorithm described above, `v1` must wait till it is processed by the correction checker before the eligibility flag is changed.  In the mean time `v1` and its approvers will still be available for tip selection.  To optimise this process, when the eligibility flag of `v2` is changed, the node can walk the tangle, changing all the eligibility flags everything in its future cone to `FALSE`. 

In a similar vein, the correction check could be triggered by events like conflict checks and opinion finalisations. These triggers could reduce the time that it takes for corrections to take place.  






## 7. Finality

Finality on the value tangle and the message tangle largely behaves the same, with only a few modification.  The primary difference is a new grade between 1 and 2 which includes the correction check.  


### Detailed Design

There are four grades of finality for a value objects.
* Grade 1: The value object  has the `eligible` flag set to `True`.
* Grade 1.5: The value object has the `eligible` flag set to `TRUE` and is not on the `correctionQueue`.
* Grade 2: The value object 
	* has Grade 1.5 finality
	* the confidence level is greater than `theta` for some parameter.
	* and is contained in a grade 2 final message
* Grade 3: The value object 
	* has Grade 2 finality 
	* the timestamp is older than `T`
	* and is contained in a grade 3 final message.  

To make these definitions precise, we define the following function:
```
Define: confirmationConfidenceValue
Inputs: messageID
Outputs: number between 0 and 1

Return Probability that getValueTip indirectly references messageID
```

### Rationale

The rationale here is largely the same as on the message tangle as discussed in [Components Subsection 4](https://hackmd.io/YfrUh4wqSua0Ou4-XHwYIA?both).  However, we introduce a finality grade in between grade 1 and grade 2 to account for the correction checks.  As discussed in the previous section, if a node is out of sync, it can select tips which later will be invalidated.  However, with finality grade 1.5, this cannot happen. 










## 8. Snapshotting

The value transfer application maintains two state machines: the ledger and the mana state.  The `snapShotFile` records the changes made to these machines so that value objects and their transactions can be deleted when they are no longer needed to validate incoming objects.  

### Detailed Design


The `snapShotFile` is divided into lists.  First, `snapShotFile.outputs' lists all the unspent outputs that have been snapshotted. Each output is stored with the following information:
* `address` The public key needed to validate the signature of a transaction consuming this output.  In other words, it is the address the funds are stored on.
* `balance` The amount of funds stored on this output.
* `pledgeType` A Boolean flag indicating which mana type the pledge is.  
* `nodeID'  The node ID receiving the mana
* `timeStamp' which is the time the output was added to the file.  
The second list, `snapShotFile.manaState' stores the mana held by each node. We refer to [the mana specification](https://) for the layout of this file.  

When a node `Book`s a transaction with `transactionID`, it performs the following actions
* Add each output in `transactionID.outputs` to `snapShotFile.outputs' and set all the fields in the obvious manner: the information for the first four fields can be found in the [transaction layout specification](https://).
* Performs the required changes in `snapShotFile.manaState' as prescribed in  [the mana specification](https://).

With these preliminaries established, we can discuss the actual mechanics of snapshotting.  Consider a value object `valueObjectID`.  At time `valueObjectID.timeStamp+snapShotTimeValue', the following logic is performed.
```
If {   		 valueObjectID.parent1 in recentlyBookedQueue
	AND  valueObjectID.parent2 in recentlyBookedQueue
	AND {Forall input in valueObjectID.transaction.outputs, output in snapShotFile.outputs}
	AND valueObjectID.eligible=TRUE
	AND confirmationConfidenceValue(valueObjectID)>theta
	}
Then 
	If valueObjectID.transaction in transactionsBookedThisEpoch,
	Then	
		 Book valueObjectID.transaction
		 Add valueObjectID.transaction to transactionsBookedThisEpoch
	Append (valueObjectID,currentTime) to recentlyBookedQueue
Endif
Forall input in valueObjectID.transaction.inputs
	Remove input from snapShotFile.outputs
Endforall
Remove  valueObjectID from valueObjectID.transaction.container 
If valueObjectID.transaction.container=empty, then remove valueObjectID.transaction from transactionList
Remove valueObjectID from valueObjectID.indexedTx.container  
If valueObjectID.indexedTX.container=empty, then remove valueObjectID.indexedTX from indexedTxList
Remove valueObjectID from pending
Remove valueObjectID from valueTangle
Remove valueObjectID from eligibleValueTipsList
```
At this point the value object has been snapshotted, and, as fas as the value transfer application is concerned, it maybe deleted from memory.  Similarly, if the container of either a transaction or indexed transaction becomes empty, it may be deleted.  

The `recentlyBookedQueue` must be regularly scrubbed, with the following perpetual loop.
```
Forall (valueObjectID,time) in recentlyBookedQueue
 	While time+w+2D>currentTime
		Do nothing
	Endwhile
	Remove (valueObjectID,time) from correctionQueue
 ```
 
 Lastly, `transactionsBookedThisEpoch` must be emptied after the node has snapshotted all value objects with index i for each value of i.  
 
 ### Rationale

Most of the information saved in  `snapShotFile` is actually only necessary for the [mana calculations](https://), and so we do not justify them here.  When snapshotting happens, we book the value object, i.e. record its changes on the state machine if and only if it s grade 3 final with `T=snapShotTime`.  However,  for each indexed transaction, we only apply the changes at most once per a single indexed transaction.  

After we determine if the changes should be booked and do the possible booking, we are free to remove value object from the value tangle.  If the value object was not booked, then it is simply forgotten. 

We recall some of the discussion about finality from the message tangle: see [Components Subsection 4](https://hackmd.io/YfrUh4wqSua0Ou4-XHwYIA?both).  In theory, the snapshotting algorithm works because at `snapShotTime` every value object will either be definitely  orphaned and has a near zero confirmation confidence, or it will not be orphaned and has a very high confirmation confidence.  Thus our snapshotting algorithm should not consider many edge cases with confirmation confidence around say .5.  This ensures that all nodes will agree on whether each value object will be orphaned or not.  

###  Alternatives

Nodes do not need to delete value objects after snapshotting.  They may archive them in memory or do whatever they wish with the information.  


## Stupid problems which remain
Problem: reattachments in higher epochs wont appear as unsolidified until the thing in the previous epoch has been snapshotted :(

Another Problem: when an epoch changes, an attacker can issue messages canceling out all the value objects at the end of the epoch.









<!--stackedit_data:
eyJkaXNjdXNzaW9ucyI6eyJiOENCTzJrcTNzVHNTZVZuIjp7In
RleHQiOiJtb3N0IiwiZW5kIjoxMjEzLCJzdGFydCI6MTIxM30s
InhHZXFQazB5T1NWcElGelQiOnsidGV4dCI6IldlIGFzc3VtZS
BhbGwgbWVzc2FnZXMgYXJlIGRlbGl2ZXJlZCB3aXRoaW4gdGhp
cyB0aW1lLiIsInN0YXJ0IjoxMzAzLCJlbmQiOjEzNzB9LCJDUz
RnWFpWd1ZvTGo1Nnk3Ijp7InRleHQiOiJlYWNoIGluZGV4LiIs
InN0YXJ0IjoxNjk3LCJlbmQiOjE3MDh9LCJPMjI0b3IyU0RFTz
lSTExoIjp7InRleHQiOiJ0aGUgdGltZSB0aWxsIHRoZSBjb3Jy
ZWN0aW9uIGNoZWNrIiwic3RhcnQiOjE3MzMsImVuZCI6MTc2N3
0sIjlab2pvMWJFZ3ltcUh0OEoiOnsidGV4dCI6InRoZXRhYCIs
InN0YXJ0IjoxNzcxLCJlbmQiOjE3Nzd9LCJ5VmJ1TDZhaUQ4MU
RQQVRpIjp7InRleHQiOiJzbmFwU2hvdCIsInN0YXJ0IjoxODY3
LCJlbmQiOjE4NzV9LCJvR0tMVWU3NUt0SGdEbVZkIjp7InRleH
QiOiJBZ2Ugb2YgYSB0cmFuc2FjdGlvbiIsInN0YXJ0IjoxODg2
LCJlbmQiOjE5MDZ9LCJ4NkQ3OG1wSTNmSGl1a0M2Ijp7InRleH
QiOiJhbHRob3VnaCB0aGlzIHBhcmFtZXRlciBpcyBnbG9iYWw6
IGl0IG11c3QgYmUgdGhlIHNhbWUgZm9yIGFsbCBub2Rlcy4iLC
JzdGFydCI6MjAzNywiZW5kIjoyMTA3fSwickVXYjE5VnJjVk1C
V3lnZiI6eyJ0ZXh0IjoiVHgiLCJzdGFydCI6MjI1MCwiZW5kIj
oyMjUyfSwiY0oxTnppS3lzUnFHVFZ0aSI6eyJ0ZXh0IjoicGFy
ZW50MWAgYW5kIGBwYXJlbnQyIiwic3RhcnQiOjM2NDAsImVuZC
I6MzY2MX0sIkpZSHJrTU15VlBqbFQ5amIiOnsidGV4dCI6InZh
bHVlIG9iamVjdHMiLCJzdGFydCI6MjE3MCwiZW5kIjoyMTgzfS
wiNDhGejI0M2lodmx2Ym53dyI6eyJ0ZXh0Ijoid2FzIGZpcnN0
IHBhcnNlZCIsInN0YXJ0Ijo0MDYyLCJlbmQiOjQwNzh9LCJkNm
RvNXp3dzl5dGlXNnN2Ijp7InRleHQiOiJoZSBpbmRleGVkIHRy
YW5zYWN0aW9uIGFzc29jaWF0ZWQgdG8gdGhlIHZhbHVlIG9iam
VjdC4iLCJzdGFydCI6NDM1NCwiZW5kIjo0NDA4fSwiaGRKS21X
dWJFczkzM0hKSCI6eyJ0ZXh0IjoiaW5kZXgraW5kZXhlZFR4SU
QudHJhbnNhY3Rpb24iLCJzdGFydCI6NDY2NywiZW5kIjo0Njk2
fSwiNWlpWlUyeUV6ajRUcU5JVSI6eyJ0ZXh0IjoidHJhbnNhY3
Rpb25gICBpcyB0aGUgaGFzaCBvZiB0aGUgdHJhbnNhY3Rpb24g
aXQgY29udGFpbnMiLCJzdGFydCI6NDc1OSwiZW5kIjo0ODE1fS
wiajZRVFJhRlYyQ3JtY2kwSSI6eyJ0ZXh0IjoiVGltZXN0YW1w
cyIsInN0YXJ0Ijo2NDkxLCJlbmQiOjY1MDF9LCJkbGkwQ251NF
V6cEVQdnhiIjp7InRleHQiOiJpdCBpcyBvYmplY3QgYW5kIiwi
c3RhcnQiOjc0MDUsImVuZCI6NzQyMX19LCJjb21tZW50cyI6ey
JtaWxUOWdTT1ExMGdkT1FXIjp7ImRpc2N1c3Npb25JZCI6ImI4
Q0JPMmtxM3NUc1NlVm4iLCJzdWIiOiJnaDo1MTExMjYxOCIsIn
RleHQiOiJ3aGF0IGRvZXMgdGhpcyBtZWFuPyIsImNyZWF0ZWQi
OjE1OTU4NzQ1ODkyMTh9LCIzQTVzMDFzN0h2b2FDUmN2Ijp7Im
Rpc2N1c3Npb25JZCI6InhHZXFQazB5T1NWcElGelQiLCJzdWIi
OiJnaDo1MTExMjYxOCIsInRleHQiOiJXaGF0IGlzIHRoZSBkaW
ZmZXJlbmNlIHRvIGQsIG5vdyBmb3IgYWxsIG5vZGVzPyIsImNy
ZWF0ZWQiOjE1OTU4NzQ2MjgzMjZ9LCJTRUNPbWdJcTc3Rk41Nk
RnIjp7ImRpc2N1c3Npb25JZCI6IkNTNGdYWlZ3Vm9MajU2eTci
LCJzdWIiOiJnaDo1MTExMjYxOCIsInRleHQiOiJ3aGF0IGluZG
V4PyBEb24gdCB1bmRlcnN0YW5kIiwiY3JlYXRlZCI6MTU5NTg3
NDY3NzYyMH0sInVGM3FZOXBXRnVUdkI1c0oiOnsiZGlzY3Vzc2
lvbklkIjoiTzIyNG9yMlNERU85UkxMaCIsInN1YiI6ImdoOjUx
MTEyNjE4IiwidGV4dCI6Ij8iLCJjcmVhdGVkIjoxNTk1ODc0Nj
k2MzM3fSwiaGJxYnY4UVZpQndtTWQ5YiI6eyJkaXNjdXNzaW9u
SWQiOiI5Wm9qbzFiRWd5bXFIdDhKIiwic3ViIjoiZ2g6NTExMT
I2MTgiLCJ0ZXh0Ijoic2FtZSBhcyBpbiBtZXNzYWdlIHRhbmds
ZT8iLCJjcmVhdGVkIjoxNTk1ODc0NzI3NDI4fSwiS2E1ZVJUc0
U4MGp1dXdBTiI6eyJkaXNjdXNzaW9uSWQiOiJ5VmJ1TDZhaUQ4
MURQQVRpIiwic3ViIjoiZ2g6NTExMTI2MTgiLCJ0ZXh0IjoiaW
4gVlRQIGl0IGlzIFwic25hcHNob3RcIiIsImNyZWF0ZWQiOjE1
OTU4NzQ4NTAxNzN9LCJyNzhlUThBbVVhWTM1SFI1Ijp7ImRpc2
N1c3Npb25JZCI6Im9HS0xVZTc1S3RIZ0RtVmQiLCJzdWIiOiJn
aDo1MTExMjYxOCIsInRleHQiOiJ3aGF0IGlzIHRoZSBhZ2Ugb2
YgYSB0cmFuc2FjdGlvbj8iLCJjcmVhdGVkIjoxNTk1ODc0ODc5
MjI0fSwiODllazRoSFRxYUhsUFhzVCI6eyJkaXNjdXNzaW9uSW
QiOiJ4NkQ3OG1wSTNmSGl1a0M2Iiwic3ViIjoiZ2g6NTExMTI2
MTgiLCJ0ZXh0IjoiV2h5IGlzIHRoaXM/IElmIG9uZSBub2RlIG
NoYW5nZXMgdGhpcyB2YWx1ZSwgcHJvdG9jb2wgYnJlYWtzPyIs
ImNyZWF0ZWQiOjE1OTU4NzQ5NjU1ODJ9LCJRZVhLOGlJcEI2Q0
lGZUM0Ijp7ImRpc2N1c3Npb25JZCI6InJFV2IxOVZyY1ZNQld5
Z2YiLCJzdWIiOiJnaDo1MTExMjYxOCIsInRleHQiOiJXaHkgbm
90IFR4IC0+IFRyYW5zYWN0aW9uPyIsImNyZWF0ZWQiOjE1OTU4
NzUxMjc5NTh9LCJZckt6TzFkYmlLM0hEYXhXIjp7ImRpc2N1c3
Npb25JZCI6ImNKMU56aUt5c1JxR1RWdGkiLCJzdWIiOiJnaDo1
MTExMjYxOCIsInRleHQiOiJ2YWx1ZVBhcmVudHMgPyB0byBkaX
N0aW5ndWlzaCBiZXR3ZWVuIHRoZSBtZXNzYWdlUGFyZW50cz8i
LCJjcmVhdGVkIjoxNTk1OTEzODE0MTMwfSwiRGg2VVRQamc3V2
xFcU81QSI6eyJkaXNjdXNzaW9uSWQiOiJKWUhya01NeVZQamxU
OWpiIiwic3ViIjoiZ2g6NTExMTI2MTgiLCJ0ZXh0Ijoid2hhdC
BpcyBhIHZhbHVlIG9iamVjdD8gQSBNZXNzYWdlIHdpdGggYSB0
cmFuc2FjdGlvbiBwYXlsb2FkPyIsImNyZWF0ZWQiOjE1OTU5MT
M5MzcwNzR9LCIxRlBIbmdQSklDOGdnSFFLIjp7ImRpc2N1c3Np
b25JZCI6IjQ4RnoyNDNpaHZsdmJud3ciLCJzdWIiOiJnaDo1MT
ExMjYxOCIsInRleHQiOiJ3aGF0IGRvZXMgcGFyc2VkIG1lYW4g
aW4gdGhlICdwcm9jZXNzaW5nXCIgb2YgYSBtZXNzYWdlPyIsIm
NyZWF0ZWQiOjE1OTU5MTQxOTc5MzZ9LCJCczB5dlNONnhxS2xm
WG5jIjp7ImRpc2N1c3Npb25JZCI6ImQ2ZG81end3OXl0aVc2c3
YiLCJzdWIiOiJnaDo1MTExMjYxOCIsInRleHQiOiI/IiwiY3Jl
YXRlZCI6MTU5NTkxNDI5MDc2Nn0sIjZwRW1aNEl5dnJ4Y2VFRD
kiOnsiZGlzY3Vzc2lvbklkIjoiaGRKS21XdWJFczkzM0hKSCIs
InN1YiI6ImdoOjUxMTEyNjE4IiwidGV4dCI6Ij8iLCJjcmVhdG
VkIjoxNTk1OTE0MzYxMzk3fSwiQmxvRGVjU1dPaVhsTUtpeiI6
eyJkaXNjdXNzaW9uSWQiOiI1aWlaVTJ5RXpqNFRxTklVIiwic3
ViIjoiZ2g6NTExMTI2MTgiLCJ0ZXh0IjoidHJhbnNhY3Rpb25J
RCA/IiwiY3JlYXRlZCI6MTU5NTkxNDQ0MzYzMn0sIjBJYmp3RU
IwTlZkZ0h1ZUUiOnsiZGlzY3Vzc2lvbklkIjoiajZRVFJhRlYy
Q3JtY2kwSSIsInN1YiI6ImdoOjUxMTEyNjE4IiwidGV4dCI6Ik
kgdGhpbmsgdGhhdCB3ZSBzaG91bGQgZGVtYW5kIHRoYXQgdGlt
ZXN0YW1wcyBpbiB0aGUgdmFsdWUgdGFuZ2xlIGFyZSBpbmNyZW
FzaW5nOyBwYXJlbnQudGltZXN0YW1wIDwgdGltZXN0YW1wLiBJ
ZiBub3Qgd2UgbWF5IGhhdmUgbmVnYXRpdmUgbWFuYSB2YWx1ZX
MuLi4iLCJjcmVhdGVkIjoxNTk1OTE0NzMzOTI1fSwiOFB4WUNo
SXZxT0RmcW9mSyI6eyJkaXNjdXNzaW9uSWQiOiJqNlFUUmFGVj
JDcm1jaTBJIiwic3ViIjoiZ2g6NTExMTI2MTgiLCJ0ZXh0Ijoi
QWggb2s7IEkgZGlkIGZpbmQgaXQgaW4gQmVsb3dNYXhEZXB0aE
NoZWNrIGZvciBtZXNzYWdlcyB3aGljaCBpbmR1Y2VzIG1vbm90
b25pY3R5IGZvciB2YWx1ZSB0YW5nbGUgYXMgd2VsbC4gU3RpbG
wgaSB0aGluayB0aGlzIG1vbm90b25pY3R5IHByb3BlcnR5IGlz
IHZlcnkgbmF0dXJhbCBhbmQgc2hvdWxkIGJlIG1lbnRpb25lZC
IsImNyZWF0ZWQiOjE1OTU5MTUzOTA2NDN9LCJGd1BjSHI0NlE2
cXVCcHFGIjp7ImRpc2N1c3Npb25JZCI6ImRsaTBDbnU0VXpwRV
B2eGIiLCJzdWIiOiJnaDo1MTExMjYxOCIsInRleHQiOiJvYmpl
Y3RpdmU/IiwiY3JlYXRlZCI6MTU5NTkxNTQ0NjIzNH0sIm9yRF
ZsbHhSVnN5VWkxSG0iOnsiZGlzY3Vzc2lvbklkIjoickVXYjE5
VnJjVk1CV3lnZiIsInN1YiI6ImdoOjUwNjYxODQ0IiwidGV4dC
I6Ikl0cyB0b28gbG9uZyB0byB3cml0ZSBvdmVyIGFuZCBvdmVy
IiwiY3JlYXRlZCI6MTU5NTkyNzAwNTU0MH0sIlFYc1FWVEZFWk
FUZXd1Q0QiOnsiZGlzY3Vzc2lvbklkIjoiY0oxTnppS3lzUnFH
VFZ0aSIsInN1YiI6ImdoOjUwNjYxODQ0IiwidGV4dCI6IlBhcm
VudCBpcyBhIHJlbGF0aXZlIHRlcm0uICBUaGUgcGFyZW50cyBv
ZiBhIHZhbHVlIG9iamVjdCBhcmUgYWdhaW4gdmFsdWUgb2JqZW
N0cy4iLCJjcmVhdGVkIjoxNTk1OTI3MDk5NTg5fX0sImhpc3Rv
cnkiOlsxODk4MTM1MTA5LC05NzIwOTEyNzJdfQ==
-->
*  Interaction between FPC and the message tangle and message tangle.
* Start date 26 May 2020
# Summary

FPC is a binary voting protocol: it takes an initial boolean value and outputs a final boolean value. The opinion changes through a series of queries. 

This note describes how this binary voting protocol interacts with the rest of the IOTA protocol.  Specifically, we define two functions, `queryStatus` and `answerStatus` which govern when an object should be included in  a query or a responce. 

# Motivation

The FPC module can vote on many different questions, however it itself is agnostic to the rest of the protocol.  Every node has to vote on timestamps and conflicts, however anyone can create other applications which use FPC.

We want a generic way for FPC to interact with data structures in other applications. Specifically, an application needs a way to determine when to have FPC run. For instance, it is not efficient to vote on every object of a particular type.  Moreover, we do not want FPC to vote on an object multiple times.  

Voting is a two part process: quering and answering queries.  The function `queryStatus` determines if a node should querry about a particular object, and 'answerStatus' determines if the node should respond.  

# Detailed design
## Parameters and lists
* `d` is defined in a different specification.  It is the estimated network delay and will be approximately 5 seconds. 
* `votingEnabledObjectTypes` lists which object types can be voted upon.  By default, the object types `message` and `transaction` must be in this list.  However, nodes can run applications which vote on other object types.  

## How opinions on objects are stored

Every object whose type is in `votingEnabledObjectTypes` must be stored with an `opinionField` which is either `NULL`  or the triplet `(opinion,level,timeFormed)`.  The field `opinion` is a Boolean value,  `level` is a number in the list $\{1,2,3\}$, and `timeFormed` is the time the field was changed from `NULL`.

As will be discussed in a different specification, an opinion field will be  `NULL` untill the node has received information allowing it to form an opinion, e.g. detect a conflict.  Thus an object with opinion field  `NULL` should be considered "good". 

## Query Status

The `queryStatus` function is defined through the following.
```
Inputs: (type,objectID)
Output: Boolean value

If type not in VotingEnabledObjectTypes
    Then return FALSE
    Else
        If opinionField not= NULL AND level=1 and currentTime>timeFormed+d
            Then Return TRUE
            Else Return FALSE       
```
Lastly, if the object does not exist, the function should return `FALSE`.
## Answer Status

The `answerStatus` function is defined as follows.

```
Inputs: (type,objectID)
Output: Boolean value

If type not in VotingEnabledObjectTypes
    Then return FALSE
    Else
        If opinionField not=NULL AND (level=1 OR level=2) 
            Then Return TRUE
            Else Return FALSE 
```
Lastly, if the object does not exist, the function should return `FALSE`.
# Rationale and Alternatives

The `level` field indicates the level of knowledge. It tells us information about what other nodes know.
* Level 1 means that I only know that I hold this opinion.
* Level 2 means that I know that everyone else has this opinion too (with high probability).
* Level 3 means that I know that everyone has level 2 knowledge.

If a node node only has level 1 knowledge, it needs to vote.  However, if it has level 2 knowledge, it does not need querry: we know that all nodes have the same opinion.  With level 3 knowledge, we know that no other nodes have level 2 knowledge and thus should not send our node querries.  Thus with level 3 knowlege, the node need not respond.  The level of knowledge is the primary criterion in these functions.  

Moreover, we should not query about objects whose opinion is `NULL`. In a similar vein, we need should not query about an object unill `d` time after the opinion was set, so we we can be sure that all other nodes have set their opinion too. 

Alternatively, we can attempt to manage the same system with a series of finality flags.  However, this has two problems.  First,  we either mark objects which we have never voted upon as final, or some objects will never get a finality flag.  This leads to some complicated, unintuitive logic. 

Second, if an attacker can cause only small portions of the network to vote on an object, that vote would be susceptible to an attack.  Thus we need consensus about what to vote on. However, if voting is a binary "yes" or "no", we would need a consesus algorithm to determine when to vote.  The levels of knowlege does not treat voting in a binary way, bypassing this problem.  






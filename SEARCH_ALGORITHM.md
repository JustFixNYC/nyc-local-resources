# Writing queries for Referral Directory search optimization
#### Filter based on column value
Select orgs with a given value in column:
```
SELECT * FROM database WHERE loc.housingCourt = true . . .
```
#### Ordering results:
Currently, the program calculates a composite score of all the factors involved in ordering organizations by assigning values to individual scores

and then combining them all into a single formula
```
ORDER BY (legal_score*scope_score*govt_score)/(dist + 1)
```

To add many scores to your final formula without manually typing them out, use a for loop to assign values to these scores. This loop creates a variable for every tag in the array userTags, then assigns 0 to each variable
```
for (var tag in userTags) {
  query += "0 as "+userTags[tag]+";
}
```
To order by multiple variables:
```
ORDER BY score ASC, dist DESC
```
will begin by ordering all results by score in ascending order, then use dist as a "tie-breaker"

#### Conditional statements in SQL
Assign values to a new variable depending on a boolean condition
```
case when (loc.org_type='govt') then .05 else 1 end as govt_score
```


#### Other useful functions
Check if a string is a substring of another string (e.g., to check if a user tag is contained within an organization's comma-separated tags)
```
case when (position('"+userTags[tag]+"' in loc.tags) != 0) then ...
```

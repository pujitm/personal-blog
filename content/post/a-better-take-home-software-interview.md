+++
authors = []
date = ""
draft = true
excerpt = ""
hero = ""
timeToRead = 0
title = "A better take-home software interview"

+++
Interviewing software development candidates is tough. It _feels_ like you (as the interviewer) have to choose between spending a metric ton of time evaluating candidates and wasting time on a sub-par hire.

It's almost a catch-22 (the tradeoffs among different interview strategies are adequately described in [this Reddit comment](https://www.reddit.com/r/programming/comments/hrm3kw/tech_job_interviews_assess_performance_anxiety/fy58oe2?utm_source=share&utm_medium=web2x)).

Surely there's a way to reduce the time it takes to acknowledge a candidate as fit for the job--right?

I am biased towards take-home questions. They allow me to evaluate candidates in an environment similar to their would-be work setting (especially for remote positions).

Oh, and they would also grant me, personally, a massive unfair advantage over fellow interview candidates--time. 

***

So, I tried to make a better take-home question.

About 2 weeks ago, I asked the 6 junior developers working under me to participate in a little experiment. I gave them a vague prompt, some starter code, and asked them to make a program conforming to it.

You can find everything I gave to them on my blah-blah-blah repo (link).

In the meantime, I drafted a document to help me evaluate responses. I wrote this before receiving or writing any code to reduce bias. Here's what I came up with:

\`\`\`ts

console.log('hi')

\`\`\`

Then, as per the developers' wishes, I also wrote my submission (link to github).

Side Note: I tried to use Github Classroom for the interview workflow. In hindsight, I should have made a separate organization specifically for these take-home questions. I think this flow has a lot of room for improvement.

***

That weekend, we convened to discuss and critique each other's code together. This was brave of them, and I'm proud that they were willing to be so vulnerable to each other!

I was a bit shocked by what I found.

For context, these developers were third-year undergraduate computer science students, and 3 of the 6 attended top 15 computer science programs. I expected the students from higher ranking programs to produce better programs.

This was not the case.

To my surprise, the submissions were by and large the same. Of course, each of them had different strengths and weaknesses that shone through. Some organized and placed/scoped their logic more appropriately while others used better variable names and typings (all of them chose to use Typescript). The average submission looked like:

\`\`\`ts

console.log('hi);

\`\`\`

Honestly, I felt a bit dismayed when I first saw this. I felt like an ineffective mentor/teacher because I had tried to teach them to think and structure their code more readably and more configurably. 

After reflection, I think I should have provided controlled exercises allowing them to use concepts practically.

Nonetheless,
# Long story agent

This is an agent to generate long stories

Strategy

1. generate a synopsis of the complete story. example:
"Hugh, a middle aged accountant goes on a journey to find his long lost love, Mary. Along the way, he faces many challenges and meets new friends who help him on his quest. In the end, Hugh finds Mary and they live happily ever after."

this should be based on the user provided scenario, characters, etc.

2. generate a story arc in chapters and a one-liner for each chapter. example:
Chapter 1: Hugh's life as an accountant
describes Hugh's current bring life as an accountant, his longing for adventure and his memories of Mary.
Chapter 2: The decision to go on a journey
Hugh decides to leave his job and go on a journey to find Mary. He packs his bags and says goodbye to his friends and family.
Chapter 3: The journey begins
Hugh sets out on his journey and faces many challenges along the way. He meets new friends who help him on his quest.

this must be in json format, with the chapter title as the key and the one-liner as the value.

now we can start geenrating the chapters in detail, based on the story arc. for each chapter, we will generate a detailed storyline, divided in 3 parts: intro/setup, main event, and conclusion. this must still be very high level, and not go into the details of the story, but should give a clear idea of what happens in the chapter.

Start with the first chapter.

3. generate a chapter storyline in detail. so given the start conditions / ending of the previous chapter, the current chapter title and description, and the character sheets, create an abstract description of what happens in the current chapter, divided in 3 parts: intro/setup, main event, and conclusion. This must still be very high level, and not go into the details of the story, but should give a clear idea of what happens in the chapter. We will use these chapter storylines to generate the actual story text in the next step.
example:
Chapter 1: Hugh's life as an accountant
(setup) Hugh is a middle aged accountant living in a small town. He has a boring job and a mundane life.
(main event) Hugh is browing the internet and finds a picture of someone looking like Mary, his long lost love. His coworker convinces him to follow his heart and go on a journey to find her.
(conclusion) the chapter ends in a cliffhanger, with Hugh packing his bags and saying goodbye to his friends and family, ready to embark on his adventure.

4. generate the actual story text for each chapter, based on the chapter storyline and the character sheets. this should be a detailed narrative of the chapter, with dialogue, descriptions, etc. it should be engaging and immersive, and should bring the story to life for the reader. this can be streamed back to the frontend.
5. generate the next chapter (step 3) and repeat steps 4 and 5 until the story is complete. The frontendd should be able to interrupt at this point and provide feedback, which can be used to adjust the story arc or the chapter storylines before generating the next chapters. but that will be implemented in a later phase - just make sure it's easy to implement later; for now we will generate the entire story until done.
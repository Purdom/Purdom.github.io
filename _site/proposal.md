DH 2016
Title: Genealogy of Reading, a small linked data project
Session Leader: Purdom Lindblad, Eric Rochester, Jeremy Boggs
Session Genre: Short Paper (max 1,500 words)

Slides/Poster Needs:
* URL to site and github repos, our email, twitter handles
* flip visualizations and RFDa graph
* More context about what the project is about, is tracking, hopes to
  track in future
* uses/applications--keep mostly on personal reading, but can point to
  ways of making it easier for ppl to integrate into their personal writing,\
  some kind of editor
* more data/readings entries







-------DLF-----
Title: Genealogy of Reading, a small linked data project
Session Leader: Purdom Lindblad, Eric Rochester, Jeremy Boggs
Session Genre: Community Idea Exchange 

Proposal:

Origin - what caused you to start doing this project?
Scope - 1-2 sentence summary of what the project is.
Difference - What affordances does this project provide?

The Genealogy of Reading project emerged from a curiosity about the shape of personal reading habits: what books caused me to read other books, and how the books I’ve read helped develop thematic networks over time. If we can map the process of how one reads, could we begin to see broader themes, issues, or concerns that hint at why one reads? The project takes an abstract model of linked open data and applies it to a web-based project on personal reading habits. Undertaking the project itself affords ways to learn the constraints and opportunities of linked data for myself and creates a sandbox for thinking about leveraging linked data in a variety of other contexts. Visualizations will help map relationships between books—particularly to get a sense of what books cause me to read other books, explore the regional distribution of authors, and reveal broad themes within a cohort of books.

We use a combination of technologies to create a system that allows for relatively easy management and reuse of linked data. We’ve implemented this site in Jekyll (http://jekyllrb.com/), and have developed a custom plugin to scan some of a site’s content to extract any triples encoded using RDFa. Optionally, it supplements these triples by querying DBpedia (http://dbpedia.org) for more information about the books, authors, and other topics being discussed on the site. The plugin writes all of the extracted and aggregated information out as JSON-LD (http://json-ld.org/), which itself can be used as input for visualizations we create using D3 (http://d3js.org/) and other modern visualization libraries. 

Abstract:
This poster shares the process and results of a small linked open data project exploring a “genealogy of reading.” Through a custom Jekyll plugin, we can extract RDFa triples from a website. The plugin writes the information about books and authors out as JSON-LD triplets, which are used as input for a variety of visualizations. The visualizations enable the user to move between big-picture views of a corpus and close-readings of individual books. Exposing the relationships between authors, books, and themes can prompt new directions for future reading and new ways of thinking about a personal corpus. 



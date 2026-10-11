---
title: Welcome, and how to write a post
date: 2026-09-20
summary: A sample article that shows every writing feature of this site, and how to add your own posts in two steps.
category: reflections
tags: [markdown, writing, template]
sample: true
---

This is a **sample article**. It exists to show what a post can contain, and to explain how to replace it with your own writing.

## Adding a post in two steps

1. Create a new file in `content/blog/`, for example `my-first-post.md`.
2. Add its file name to the `posts` list in `data/content-index.js`.

That is all. The site reads the details at the top of the file (the *front matter*) to build the blog list, the search and the related-article links.

## The front matter

Every post starts with a block between two lines of three dashes:

```text
---
title: My first post
date: 2026-10-01
updated: 2026-10-05
summary: One sentence that appears in the blog list and in search results.
category: electronics
tags: [circuits, notes]
cover: assets/images/blog/my-cover.jpg
coverAlt: Describe the image for people who cannot see it.
---
```

Only `title` and `date` are really needed. Add `draft: true` to hide a post while you are still writing it.

## Writing features

Text can be **bold**, *italic* or `inline code`, and you can add [links](https://example.com) and lists:

- Bullet lists work.
- So do numbered lists and nested lists.
  - Like this one.

Checklists are supported too:

- [x] Write the first draft
- [ ] Check the numbers and units
- [ ] Add references

### Code with colours and a copy button

```python
def moving_average(values, window=3):
    """Return the moving average of a list of numbers."""
    result = []
    for i in range(len(values) - window + 1):
        result.append(sum(values[i:i + window]) / window)
    return result

print(moving_average([2, 4, 6, 8, 10]))  # [4.0, 6.0, 8.0]
```

### Equations

Write inline equations between single dollar signs, like $V = I R$ or $f_c = \frac{1}{2\pi RC}$, and display equations between double dollar signs:

$$P = \frac{V^2}{R} = I^2 R$$

Write `\$` when you need a literal dollar sign.

### Tables

| Quantity | Symbol | Unit |
|----------|:------:|-----:|
| Voltage | V | volt (V) |
| Current | I | ampere (A) |
| Resistance | R | ohm (Ω) |

### Images with captions

Use `![Alt text](path/to/image.svg "Caption shown under the image"){1000x600}`. The numbers at the end are the image width and height, which keep the page from jumping while the image loads. See the next article for a real example.

> Tip: always write alt text that describes what the image shows. It helps people using screen readers and appears if the image cannot be loaded.

## When you are ready

Delete the three sample posts, or keep one as a reference. Then set `showSampleNotices: false` in `data/site.js` to remove the "Sample" labels.

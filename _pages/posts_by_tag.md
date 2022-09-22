---
layout: page
title: Tags para filtrar tu búsqueda
permalink: /tags
---

**Aquí estarán listados los tags de los posts del blog.**

{% assign sorted_tags = site.tags | sort %}
<ul class="tag-box">
	{% for tag in sorted_tags %}
		{% assign t = tag | first %}
		{% assign posts = tag | last %}
		<li><a href="#{{ t }}">{{ t }} <span class="size">({{ posts.size }})</span></a></li>
	{% endfor %}
</ul>

{% for tag in sorted_tags %}
  {% assign t = tag | first %}
  {% assign posts = tag | last %}

  <h4 class="mt-5 mb-neg-30" id="{{ t }}">🎈 <u>{{ t }}</u></h4>
  <div class="blog-grid-container">
    {% for post in posts %}
      {% if post.tags contains t %}
        {% include postbox.html %}
      {% endif %}
    {% endfor %}
  </div>
{% endfor %}
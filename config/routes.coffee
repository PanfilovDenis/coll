exports.routes = (map)->
  map.root('welcome#index');
  map.resources 'document'

  map.socket('hello-world', 'hello#world');
  # Generic routes. Add all your routes below this line
  # feel free to remove generic routes
  map.all ':controller/:action'
  map.all ':controller/:action/:id'
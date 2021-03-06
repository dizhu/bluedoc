# frozen_string_literal: true

class Group
  include Searchable
  include Elasticsearch::Model

  index_name { "#{Rails.env}-groups" }
end

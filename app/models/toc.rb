# frozen_string_literal: true

class Toc < ApplicationRecord
  belongs_to :repository
  belongs_to :doc, required: false, dependent: :destroy
  belongs_to :parent, class_name: "Toc", required: false

  # Move children to left of self, on self destroy
  # NOTE! THIS METHOD MUST KEEP BEFORE THE acts_as_nested_set METHOD
  before_destroy do
    next_children = Toc.where(repository_id: self.repository_id, parent_id: self.id).order("lft asc").all
    last = nil
    next_children.each do |child|
      last ||= self
      child.move_to(last, :right)
      last = child.reload
    end
  end

  acts_as_nested_set scope: :repository_id, dependent: :nullify

  scope :nested_tree, -> { order("lft asc") }

  def next
    self.repository.tocs.nested_tree.right_of(self.right).first
  end

  def prev
    self.repository.tocs.nested_tree.left_of(self.left).last
  end

  def self.to_markdown
    outs = []
    self.nested_tree.each do |item|
      prefix = "  " * item.depth
      outs << %(#{prefix}* [#{item.title}](#{item.url}))
    end
    outs.join("\n")
  end

  def self.to_text
    outs = []
    self.nested_tree.each do |item|
      outs << { id: item.doc_id, url: item.url, title: item.title, depth: item.depth }.as_json
    end
    outs.to_yaml
  end

  # Create tocs from the old markdown style toc text
  # This method will clear all tocs in repo, before
  def self.create_by_toc_text!(repo, toc: nil)
    toc = repo_old_toc_text(repo) if toc.nil?
    items = BlueDoc::Toc.parse(toc)
    last_item = nil
    parent = nil

    docs = repo.docs.all

    items.each do |item|
      if last_item
        if item.depth > last_item.depth
          parent = last_item
        elsif item.depth < last_item.depth
          (last_item.depth - item.depth).times do
            parent = parent&.parent
          end
        end
      end

      if item.id.blank?
        doc = docs.find { |_doc| _doc.slug == item.url }
        item.id = doc&.id
      end

      last_item = self.find_by(repository_id: repo.id, doc_id: item.id)
      if last_item
        last_item.update(parent: parent)
      else
        last_item = self.create!(
          repository_id: repo.id,
          title: item.title,
          url: item.url,
          doc_id: item.id,
          parent: parent,
        )
      end
    end

    repo.touch
  end

  # Load old toc text
  def self.repo_old_toc_text(repo)
    toc = ::RichText.where(record: repo, name: "toc").take
    return toc&.body if toc.present?

    lines = []
    repo.docs.order("id asc").each do |doc|
      lines << { title: doc.title, depth: 0, id: doc.id, url: doc.slug }.as_json
    end
    lines.to_yaml
  end
end

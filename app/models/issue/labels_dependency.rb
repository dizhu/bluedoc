class Issue
  # has_and_belongs_to_many :assignees, join_table: :users, class_name: "User", foreign_key: :assignee_ids
  scope :with_labels, -> (ids) { ids.any? ? where("ARRAY[?] <@ label_ids", ids) : all }

  # Replace issue assignees
  def update_labels(label_ids)
    self.label_ids = label_ids.uniq
    self.save
  end

  def labels
    return @labels if defined? @labels

    records = self.repository.issue_labels.where(id: self.label_ids)
    records.sort_by { |record| self.label_ids.index(record.id) }
  end

  def labels=(val)
    @labels = val
  end

  class << self
    def preload_labels
      label_ids = all.collect(&:label_ids).flatten.compact
      labels = Label.where(id: label_ids)
      records = all
      records.each do |item|
        item.labels = labels.select { |u| item.label_ids.include?(u.id) }
      end
      records
    end
  end
end
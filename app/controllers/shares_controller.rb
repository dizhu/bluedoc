# frozen_string_literal: true

class SharesController < ApplicationController
  before_action :set_share, only: [:show, :destroy]

  def show
    if @share.shareable_type == "Doc"
      @doc = @share.shareable
      if @doc.blank? || @doc&.repository.blank? || @doc&.repository&.user.blank?
        raise ActiveRecord::RecordNotFound
      end

      current_user&.read_doc(@doc)
    end

    render :show, layout: "reader"
  end

  private
    def set_share
      @share = Share.find_by_slug!(params[:id])
    end
end

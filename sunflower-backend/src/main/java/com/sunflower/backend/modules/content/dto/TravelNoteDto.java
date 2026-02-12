package com.sunflower.backend.modules.content.dto;

import java.util.ArrayList;
import java.util.List;

public class TravelNoteDto {

    private String id;
    private String title;
    private String author;
    private int likes;
    private List<String> tags;
    private String summary;

    public TravelNoteDto(String id, String title, String author, int likes, List<String> tags, String summary) {
        this.id = id;
        this.title = title;
        this.author = author;
        this.likes = likes;
        this.tags = new ArrayList<>(tags);
        this.summary = summary;
    }

    public String getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public String getAuthor() {
        return author;
    }

    public int getLikes() {
        return likes;
    }

    public List<String> getTags() {
        return tags;
    }

    public String getSummary() {
        return summary;
    }
}

package com.sunflower.backend.modules.content.dto;

import com.sunflower.backend.modules.room.dto.RoomDto;
import java.util.ArrayList;
import java.util.List;

public class HomeDataResponse {

    private List<HomeBannerDto> banners;
    private List<ServiceEntryDto> services;
    private List<RoomDto> featuredRooms;
    private List<String> memberBenefits;

    public HomeDataResponse(
        List<HomeBannerDto> banners,
        List<ServiceEntryDto> services,
        List<RoomDto> featuredRooms,
        List<String> memberBenefits
    ) {
        this.banners = new ArrayList<>(banners);
        this.services = new ArrayList<>(services);
        this.featuredRooms = new ArrayList<>(featuredRooms);
        this.memberBenefits = new ArrayList<>(memberBenefits);
    }

    public List<HomeBannerDto> getBanners() {
        return banners;
    }

    public List<ServiceEntryDto> getServices() {
        return services;
    }

    public List<RoomDto> getFeaturedRooms() {
        return featuredRooms;
    }

    public List<String> getMemberBenefits() {
        return memberBenefits;
    }
}

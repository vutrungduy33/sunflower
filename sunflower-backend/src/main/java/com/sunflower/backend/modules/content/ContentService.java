package com.sunflower.backend.modules.content;

import com.sunflower.backend.modules.content.dto.HomeBannerDto;
import com.sunflower.backend.modules.content.dto.HomeDataResponse;
import com.sunflower.backend.modules.content.dto.PoiDto;
import com.sunflower.backend.modules.content.dto.ServiceEntryDto;
import com.sunflower.backend.modules.content.dto.TravelNoteDto;
import com.sunflower.backend.modules.room.RoomService;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ContentService {

    private final RoomService roomService;

    private final List<HomeBannerDto> homeBanners = Arrays.asList(
        new HomeBannerDto("banner-1", "湖景连住优惠", "连住 2 晚立减 120 元", "立即预订"),
        new HomeBannerDto("banner-2", "机场接驳服务", "提前一天预约，专车直达民宿", "查看服务")
    );

    private final List<ServiceEntryDto> serviceEntries = Arrays.asList(
        new ServiceEntryDto("service-transfer", "机场接驳", "丽江机场往返，提前一天预约", "car"),
        new ServiceEntryDto("service-boat", "猪槽船预订", "合作船队，住客折扣价", "map-information-2"),
        new ServiceEntryDto("service-food", "特色餐饮", "柴火鸡/石锅鱼到店福利", "shop")
    );

    private final List<PoiDto> poiList = Arrays.asList(
        new PoiDto(
            "poi-lvjiawan",
            "吕家湾码头",
            "码头",
            0.2,
            "步行 5 分钟可达，日出观景点。",
            27.7326,
            100.7762
        ),
        new PoiDto(
            "poi-goddess-bay",
            "女神湾观景台",
            "景点",
            8.6,
            "热门日落点，适合拍照打卡。",
            27.7781,
            100.7365
        ),
        new PoiDto(
            "poi-caohai-bridge",
            "草海走婚桥",
            "文化景点",
            11.4,
            "摩梭文化体验必去路线。",
            27.7758,
            100.7879
        )
    );

    private final List<TravelNoteDto> travelNotes = Arrays.asList(
        new TravelNoteDto(
            "note-1",
            "两天一晚泸沽湖亲子慢游路线",
            "向日葵住客",
            126,
            Arrays.asList("亲子", "路线"),
            "包含到达、环湖、晚餐与日出行程安排，适合带娃家庭。"
        ),
        new TravelNoteDto(
            "note-2",
            "冬季来泸沽湖怎么穿？住客避坑清单",
            "前台管家",
            89,
            Arrays.asList("攻略", "避坑"),
            "从温差、道路到保暖装备，一次说清淡季出行注意事项。"
        )
    );

    private final List<String> memberBenefits = Arrays.asList(
        "首单立减券（下单可用）",
        "复购券（退房后自动发放）",
        "接驳服务优先预约"
    );

    public ContentService(RoomService roomService) {
        this.roomService = roomService;
    }

    public HomeDataResponse getHomeData(String checkInDate) {
        return new HomeDataResponse(
            homeBanners,
            serviceEntries,
            roomService.listFeaturedRooms(checkInDate),
            memberBenefits
        );
    }

    public List<PoiDto> getPoiList() {
        return Collections.unmodifiableList(poiList);
    }

    public List<TravelNoteDto> getTravelNotes() {
        return Collections.unmodifiableList(travelNotes);
    }
}

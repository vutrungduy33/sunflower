package com.sunflower.backend.modules.content;

import com.sunflower.backend.common.api.ApiResponse;
import com.sunflower.backend.modules.content.dto.HomeDataResponse;
import com.sunflower.backend.modules.content.dto.PoiDto;
import com.sunflower.backend.modules.content.dto.TravelNoteDto;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api")
public class ContentController {

    private final ContentService contentService;

    public ContentController(ContentService contentService) {
        this.contentService = contentService;
    }

    @GetMapping("/content/home")
    public ApiResponse<HomeDataResponse> getHomeData(@RequestParam(required = false) String checkInDate) {
        return ApiResponse.ok(contentService.getHomeData(checkInDate));
    }

    @GetMapping("/poi")
    public ApiResponse<List<PoiDto>> getPoiList() {
        return ApiResponse.ok(contentService.getPoiList());
    }

    @GetMapping("/posts")
    public ApiResponse<List<TravelNoteDto>> getTravelNotes() {
        return ApiResponse.ok(contentService.getTravelNotes());
    }
}

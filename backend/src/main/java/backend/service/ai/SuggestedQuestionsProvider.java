package backend.service.ai;

import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SuggestedQuestionsProvider {

    private static final List<String> SUGGESTED_QUESTIONS = List.of(
            "Tối nay 18h đến 20h còn phòng nào trống?",
            "Tôi đi 4 người, phòng nào phù hợp?",
            "Có phòng nào dưới 200k một giờ không?",
            "Phòng rẻ nhất hiện tại là phòng nào?",
            "Tôi muốn phòng rộng cho nhóm đông người thì nên chọn phòng nào?",
            "Cho tôi xem tất cả phòng đang có",
            "Phòng nào phù hợp để tập band trong 2 giờ?",
            "Tư vấn giúp tôi phòng phù hợp với ngân sách 300k"
    );

    public List<String> getSuggestedQuestions() {
        return SUGGESTED_QUESTIONS;
    }
}

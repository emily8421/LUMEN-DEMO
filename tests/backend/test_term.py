import unittest

from backend.model.entities import TermStatus
from backend.repository.demo_repository import DemoRepository
from backend.service.term import (
    TermAccessError,
    TermValidationError,
    TermWrite,
    create_term,
    delete_term,
    find_matching_terms,
    list_visible_terms,
    update_term,
)


class TermServiceTest(unittest.TestCase):
    def test_create_list_update_delete_space_term(self) -> None:
        repository = DemoRepository()
        created = create_term(
            repository,
            user_id=1,
            current_space_id=10,
            request=TermWrite(term="触发延迟", definition="空间定义", aliases=["开关延迟"], status=TermStatus.CONFIRMED),
        )

        listed = list_visible_terms(repository, user_id=1, current_space_id=10)
        updated = update_term(
            repository,
            user_id=1,
            current_space_id=10,
            term_id=created.id,
            request=TermWrite(term="触发延迟", definition="更新定义", aliases=[], status=TermStatus.PENDING),
        )
        delete_term(repository, user_id=1, current_space_id=10, term_id=created.id)

        self.assertEqual(listed[0].id, created.id)
        self.assertEqual(updated.definition, "更新定义")
        self.assertEqual(updated.status, TermStatus.PENDING)
        self.assertNotIn(created.id, [term.id for term in list_visible_terms(repository, user_id=1, current_space_id=10)])

    def test_space_term_overrides_global_term(self) -> None:
        repository = DemoRepository()
        created = create_term(
            repository,
            user_id=3,
            current_space_id=20,
            request=TermWrite(term="触发延迟", definition="BrightLite 空间定义", aliases=[], status=TermStatus.CONFIRMED),
        )

        listed = list_visible_terms(repository, user_id=3, current_space_id=20)
        matched = find_matching_terms(repository, current_space_id=20, text="触发延迟是多少？")

        self.assertEqual(listed[0].id, created.id)
        self.assertEqual(matched[0].definition, "BrightLite 空间定义")

    def test_non_member_cannot_create_space_term(self) -> None:
        repository = DemoRepository()

        with self.assertRaises(TermAccessError):
            create_term(
                repository,
                user_id=3,
                current_space_id=10,
                request=TermWrite(term="Denied", definition="Denied", aliases=[], status=TermStatus.CONFIRMED),
            )

    def test_term_requires_name_and_definition(self) -> None:
        repository = DemoRepository()

        with self.assertRaises(TermValidationError):
            create_term(
                repository,
                user_id=1,
                current_space_id=10,
                request=TermWrite(term=" ", definition="definition", aliases=[], status=TermStatus.CONFIRMED),
            )

    def test_term_create_with_category_and_source(self) -> None:
        from backend.service.term_category import TermCategoryCreateRequest, create_term_category

        repository = DemoRepository()
        category = create_term_category(repository, 1, 10, TermCategoryCreateRequest(name="研发与开发流程"))
        created = create_term(
            repository,
            user_id=1,
            current_space_id=10,
            request=TermWrite(
                term="需求分析",
                definition="对用户需求进行归纳。",
                aliases=["需求整理"],
                status=TermStatus.CONFIRMED,
                category_id=category.id,
                category="操作/过程类",
                source="行业标准",
            ),
        )

        self.assertEqual(created.category_id, category.id)
        self.assertEqual(created.category, "操作/过程类")
        self.assertEqual(created.source, "行业标准")

    def test_term_category_cross_space_rejected(self) -> None:
        from backend.service.term_category import TermCategoryCreateRequest, create_term_category

        repository = DemoRepository()
        s20 = create_term_category(repository, 1, 20, TermCategoryCreateRequest(name="Space20C"))
        # 在 space10 建术语，但挂 space20 的领域 → 4220
        with self.assertRaises(TermValidationError):
            create_term(
                repository,
                user_id=1,
                current_space_id=10,
                request=TermWrite(
                    term="X",
                    definition="X",
                    aliases=[],
                    status=TermStatus.CONFIRMED,
                    category_id=s20.id,
                ),
            )


if __name__ == "__main__":
    unittest.main()

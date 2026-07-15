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


if __name__ == "__main__":
    unittest.main()

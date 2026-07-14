import assert from "node:assert/strict";
import test from "node:test";

import { canManageTaxonomyClient, hasTaxonomyManagePrivileges } from "../../lib/utils/authz";

test("taxonomy 写权限：author / admin / super_admin 允许，user 拒绝", () => {
  assert.equal(hasTaxonomyManagePrivileges({ userId: 1, username: "a", role: "author" }), true);
  assert.equal(hasTaxonomyManagePrivileges({ userId: 2, username: "b", role: "admin" }), true);
  assert.equal(
    hasTaxonomyManagePrivileges({
      userId: 3,
      username: "root",
      role: "super_admin",
      isRoot: true,
    }),
    true
  );
  assert.equal(hasTaxonomyManagePrivileges({ userId: 4, username: "u", role: "user" }), false);
  assert.equal(hasTaxonomyManagePrivileges(null), false);
});

test("客户端 taxonomy 管理角色判断与 JWT 规则对齐", () => {
  assert.equal(canManageTaxonomyClient({ role: "author" }), true);
  assert.equal(canManageTaxonomyClient({ role: "admin" }), true);
  assert.equal(canManageTaxonomyClient({ role: "super_admin" }), true);
  assert.equal(canManageTaxonomyClient({ role: "user" }), false);
  assert.equal(canManageTaxonomyClient(null), false);
});
